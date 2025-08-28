import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "your-secret-key";

// Generate test tokens with different scopes
const tokens = {
  readOnly: jwt.sign(
    {
      sub: "user-123",
      scopes: ["orders.read"],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    },
    secret
  ),
  readWrite: jwt.sign(
    {
      sub: "user-456",
      scopes: ["orders.read", "orders.write"],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    },
    secret
  ),
  noScopes: jwt.sign(
    {
      sub: "user-789",
      scopes: [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    },
    secret
  ),
};

console.log("🔑 Test JWT Tokens Generated:");
console.log("");
console.log("📖 READ ONLY (orders.read):");
console.log(tokens.readOnly);
console.log("");
console.log("✍️  READ/WRITE (orders.read, orders.write):");
console.log(tokens.readWrite);
console.log("");
console.log("❌ NO SCOPES:");
console.log(tokens.noScopes);
console.log("");
console.log("💡 Usage examples:");
console.log(
  'curl -H "Authorization: Bearer ' +
    tokens.readWrite +
    '" http://localhost:3000/orders'
);
console.log("");
console.log("🔍 JWT Secret used:", secret);
