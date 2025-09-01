export interface JWTPayload {
  sub: string;
  scopes: string[];
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

export interface AuthContext {
  user: {
    id: string;
    scopes: string[];
  };
}
