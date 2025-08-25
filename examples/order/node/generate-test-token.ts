import * as jwt from "jsonwebtoken";

// This is a simple utility to generate JWT tokens for testing
// In a real environment, tokens would be issued by an OAuth2/OIDC provider

const secret = process.env.JWT_SECRET || "your-secret-key";

const payload = {
  sub: "user-123",
  scopes: ["orders.read", "orders.write"],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
};

const token = jwt.sign(payload, secret);

console.log("Test JWT Token:");
console.log(token);
console.log("\nDecoded payload:");
console.log(jwt.decode(token));
console.log("\nUse this token in your API calls:");
console.log(`Authorization: Bearer ${token}`);
