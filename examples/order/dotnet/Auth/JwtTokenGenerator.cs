using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OrdersService.Auth;

public static class JwtTokenGenerator
{
    public static string GenerateToken(List<string> scopes)
    {
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "your-super-secret-jwt-signing-key-min-256-bits";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new("sub", "test-user"),
            new("iss", "orders-service"),
            new("aud", "orders-service")
        };

        // Add scope claims
        foreach (var scope in scopes)
        {
            claims.Add(new Claim("scope", scope));
        }

        var token = new JwtSecurityToken(
            issuer: "orders-service",
            audience: "orders-service",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static void PrintTestTokens()
    {
        Console.WriteLine("=== TEST JWT TOKENS ===");
        Console.WriteLine();

        var readToken = GenerateToken(new List<string> { "orders.read" });
        Console.WriteLine("Read-only token (orders.read):");
        Console.WriteLine(readToken);
        Console.WriteLine();

        var writeToken = GenerateToken(new List<string> { "orders.read", "orders.write" });
        Console.WriteLine("Read-write token (orders.read, orders.write):");
        Console.WriteLine(writeToken);
        Console.WriteLine();

        Console.WriteLine("Use these tokens in the Authorization header:");
        Console.WriteLine("Authorization: Bearer <token>");
    }
}
