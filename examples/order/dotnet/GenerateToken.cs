using OrdersService.Auth;

// Check for command line arguments
var args = Environment.GetCommandLineArgs();

if (args.Length > 1 && args[1] == "--generate-tokens")
{
    JwtTokenGenerator.PrintTestTokens();
    Environment.Exit(0);
}

if (args.Length > 1 && args[1] == "--generate-token")
{
    // Parse scopes from command line
    var scopes = new List<string>();
    for (int i = 2; i < args.Length; i++)
    {
        if (args[i] == "--scopes" && i + 1 < args.Length)
        {
            var scopeList = args[i + 1].Split(',');
            scopes.AddRange(scopeList);
            break;
        }
    }
    
    if (scopes.Count == 0)
    {
        scopes.Add("orders.read");
        scopes.Add("orders.write");
    }
    
    var token = JwtTokenGenerator.GenerateToken(scopes);
    Console.WriteLine(token);
    Environment.Exit(0);
}

// Regular application startup code would continue here...
// This is handled by the WebApplication.CreateBuilder() in Program.cs
