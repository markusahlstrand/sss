import * as jwt from "jsonwebtoken";

interface TokenPayload {
  sub: string;
  scopes?: string[];
  permissions?: string[];
  exp?: number;
  iat?: number;
}

export function generateTestToken(payload: Partial<TokenPayload> = {}): string {
  const secret = process.env.JWT_SECRET || "your-secret-key";

  const defaultPayload: TokenPayload = {
    sub: "test-user",
    scopes: [
      "vendors.read",
      "vendors.write",
      "catalog.read",
      "catalog.write",
      "users.read",
      "users.write",
      "entitlements.read",
      "entitlements.write",
    ],
    permissions: [
      "vendors:read",
      "vendors:write",
      "products:read",
      "products:write",
      "contracts:read",
      "contracts:write",
      "purchase-options:read",
      "purchase-options:write",
      "users:read",
      "users:write",
      "entitlements:read",
      "entitlements:write",
    ],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    ...payload,
  };

  return jwt.sign(defaultPayload, secret);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: tsx src/scripts/generate-token.ts [options]

Options:
  --scopes <scopes>       Comma-separated list of OAuth2 scopes
  --permissions <perms>   Comma-separated list of permissions
  --subject <sub>         Subject (user ID) for the token
  --expires <hours>       Token expiration in hours (default: 24)
  --help, -h              Show this help message

Examples:
  tsx src/scripts/generate-token.ts
  tsx src/scripts/generate-token.ts --scopes "vendors.read,vendors.write"
  tsx src/scripts/generate-token.ts --permissions "vendors:read,vendors:write"
  tsx src/scripts/generate-token.ts --subject "user123" --expires 48
`);
    process.exit(0);
  }

  const scopesArg = args.find((arg, i) => args[i - 1] === "--scopes");
  const permissionsArg = args.find((arg, i) => args[i - 1] === "--permissions");
  const subjectArg = args.find((arg, i) => args[i - 1] === "--subject");
  const expiresArg = args.find((arg, i) => args[i - 1] === "--expires");

  const payload: Partial<TokenPayload> = {};

  if (scopesArg) {
    payload.scopes = scopesArg.split(",").map((s) => s.trim());
  }

  if (permissionsArg) {
    payload.permissions = permissionsArg.split(",").map((p) => p.trim());
  }

  if (subjectArg) {
    payload.sub = subjectArg;
  }

  if (expiresArg) {
    const hours = parseInt(expiresArg, 10);
    if (!isNaN(hours)) {
      payload.exp = Math.floor(Date.now() / 1000) + hours * 60 * 60;
    }
  }

  const token = generateTestToken(payload);

  console.log("\n🔑 Generated Test JWT Token:");
  console.log(token);
  console.log("\n📋 Token payload:");
  console.log(JSON.stringify(jwt.decode(token), null, 2));
  console.log("\n💡 Use this token in the Authorization header:");
  console.log(`Authorization: Bearer ${token}`);
}
