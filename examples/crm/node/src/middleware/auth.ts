import { Context, Next } from "hono";
import { decode, verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { throwProblem } from "./error-handler";

// Type definitions for JWT payloads
export interface JWTPayload {
  sub?: string;
  scope?: string;
  scopes?: string[];
  permissions?: string[];
  iss?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

// JWKS key interface
interface JWK {
  kty: string;
  use?: string;
  kid?: string;
  n?: string;
  e?: string;
  [key: string]: any;
}

interface JWKS {
  keys: JWK[];
}

// In-memory cache for JWKS keys (5-minute TTL)
interface CachedJWKS {
  keys: Map<string, string>;
  expires: number;
}

let jwksCache: CachedJWKS = {
  keys: new Map(),
  expires: 0,
};

// Helper functions for permissions/scopes
export function hasPermissions(
  payload: JWTPayload,
  requiredPermissions: string[]
): boolean {
  if (!payload.permissions || !Array.isArray(payload.permissions)) {
    return false;
  }
  return requiredPermissions.every((perm) =>
    payload.permissions!.includes(perm)
  );
}

export function hasScopes(
  payload: JWTPayload,
  requiredScopes: string[]
): boolean {
  // Support both 'scope' (string) and 'scopes' (array) formats
  const tokenScopes: string[] = [];

  if (payload.scope && typeof payload.scope === "string") {
    tokenScopes.push(...payload.scope.split(" "));
  }

  if (payload.scopes && Array.isArray(payload.scopes)) {
    tokenScopes.push(...payload.scopes);
  }

  return requiredScopes.every((scope) => tokenScopes.includes(scope));
}

// Convert JWK to PEM format for RSA keys
async function jwkToPem(jwk: JWK): Promise<string> {
  if (jwk.kty !== "RSA" || !jwk.n || !jwk.e) {
    throw new Error("Only RSA keys are supported");
  }

  // Convert base64url to ArrayBuffer
  const nBuffer = base64urlToArrayBuffer(jwk.n);
  const eBuffer = base64urlToArrayBuffer(jwk.e);

  // Import the key using Web Crypto API
  const keyData = {
    kty: "RSA",
    n: jwk.n,
    e: jwk.e,
    alg: "RS256",
    use: "sig",
  };

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    keyData,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    true,
    ["verify"]
  );

  // Export as SPKI (Subject Public Key Info)
  const exported = await crypto.subtle.exportKey("spki", cryptoKey);
  const exportedAsBase64 = arrayBufferToBase64(exported);

  // Format as PEM
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemBody =
    exportedAsBase64.match(/.{1,64}/g)?.join("\n") || exportedAsBase64;

  return `${pemHeader}\n${pemBody}\n${pemFooter}`;
}

function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  // Convert base64url to base64
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  while (base64.length % 4) {
    base64 += "=";
  }

  // Convert to binary string then to ArrayBuffer
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Fetch JWKS and cache the keys
async function fetchJWKS(jwksUrl: string): Promise<void> {
  const now = Date.now();

  // Return cached keys if still valid (5-minute TTL)
  if (jwksCache.expires > now) {
    return;
  }

  try {
    const response = await fetch(jwksUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
    }

    const jwks: JWKS = await response.json();
    const newKeys = new Map<string, string>();

    // Convert each JWK to PEM and cache it
    for (const jwk of jwks.keys) {
      if (jwk.kid && jwk.kty === "RSA") {
        try {
          const pem = await jwkToPem(jwk);
          newKeys.set(jwk.kid, pem);
        } catch (error) {
          console.error(`Failed to convert JWK ${jwk.kid} to PEM:`, error);
        }
      }
    }

    // Update cache
    jwksCache = {
      keys: newKeys,
      expires: now + 5 * 60 * 1000, // 5 minutes
    };

    console.log(
      `Cached ${newKeys.size} JWKS keys, expires at ${new Date(
        jwksCache.expires
      )}`
    );
  } catch (error) {
    console.error("Failed to fetch JWKS:", error);
    throw error;
  }
}

// Verify JWT token using JWKS
async function verifyJWKSToken(
  token: string,
  jwksUrl: string
): Promise<JWTPayload> {
  // Decode header to get kid (key ID)
  const decoded = decode(token);
  if (!decoded.header?.kid) {
    throw new Error("Token missing kid in header");
  }

  const kid = decoded.header.kid as string;

  // Fetch JWKS if not cached or expired
  await fetchJWKS(jwksUrl);

  // Get the PEM key for this kid
  const pemKey = jwksCache.keys.get(kid);
  if (!pemKey) {
    throw new Error(`Key ${kid} not found in JWKS`);
  }

  // Verify the token
  const payload = await verify(token, pemKey, "RS256");
  return payload as JWTPayload;
}

// Static JWT verification (for development)
function verifyStaticJWT(token: string, secret: string): JWTPayload {
  const jwt = require("jsonwebtoken");
  return jwt.verify(token, secret) as JWTPayload;
}

export function authMiddleware(requiredScopes: string[] = []) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throwProblem(
        "unauthorized",
        "Unauthorized",
        401,
        "Authorization header with Bearer token required",
        c.req.url
      );
    }

    const token = authHeader.substring(7);

    try {
      let payload: JWTPayload;

      // Try JWKS validation first (production)
      const jwksUrl =
        process.env.JWKS_URL ||
        "https://token.sesamy.dev/.well-known/jwks.json";

      try {
        payload = await verifyJWKSToken(token, jwksUrl);
        console.log("Token validated using JWKS");
      } catch (jwksError) {
        console.log(
          "JWKS validation failed, falling back to static JWT:",
          (jwksError as Error).message
        );

        // Fallback to static JWT validation (development)
        const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
        payload = verifyStaticJWT(token, jwtSecret);
        console.log("Token validated using static JWT secret");
      }

      // Check required scopes
      if (requiredScopes.length > 0) {
        const hasRequiredPermissions = hasPermissions(payload, requiredScopes);
        const hasRequiredScopes = hasScopes(payload, requiredScopes);

        if (!hasRequiredPermissions && !hasRequiredScopes) {
          throwProblem(
            "forbidden",
            "Forbidden",
            403,
            `Insufficient permissions. Required: ${requiredScopes.join(", ")}`,
            c.req.url
          );
        }
      }

      // Store payload for use in handlers
      c.set("jwtPayload", payload);

      await next();
    } catch (error) {
      console.error("JWT verification failed:", error);

      if (error instanceof HTTPException) {
        throw error;
      }

      throwProblem(
        "unauthorized",
        "Unauthorized",
        401,
        "Invalid or expired token",
        c.req.url
      );
    }
  };
}
