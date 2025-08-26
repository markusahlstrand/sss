using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Context;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OrdersService.Auth;
using OrdersService.Common;
using OrdersService.Events;
using OrdersService.Health;
using OrdersService.Orders;
using System.Diagnostics;
using System.Text.Json;
using Swashbuckle.AspNetCore.Swagger;

// Handle command line arguments for token generation
var cmdArgs = Environment.GetCommandLineArgs();

if (cmdArgs.Length > 1 && cmdArgs[1] == "--generate-tokens")
{
    JwtTokenGenerator.PrintTestTokens();
    Environment.Exit(0);
}

if (cmdArgs.Length > 1 && cmdArgs[1] == "--generate-token")
{
    // Parse scopes from command line
    var scopes = new List<string>();
    for (int i = 2; i < cmdArgs.Length; i++)
    {
        if (cmdArgs[i] == "--scopes" && i + 1 < cmdArgs.Length)
        {
            var scopeList = cmdArgs[i + 1].Split(',');
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

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(new Serilog.Formatting.Compact.CompactJsonFormatter())
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();

// Configure OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Orders API", 
        Version = "1.0.0",
        Description = "Order Management Service following Service Standard v1"
    });
    
    // Add JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Configure JWT Authentication
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "your-super-secret-jwt-signing-key-min-256-bits";
var jwtKey = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Add Authorization with custom policy
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("orders.read", policy => 
        policy.RequireClaim("scope", "orders.read"));
    options.AddPolicy("orders.write", policy => 
        policy.RequireClaim("scope", "orders.write"));
});

// Configure OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing =>
    {
        tracing.SetResourceBuilder(ResourceBuilder.CreateDefault()
            .AddService("orders", "1.0.0"))
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddJaegerExporter();
    });

// Register application services
builder.Services.AddSingleton<IOrdersService, OrdersService.Orders.OrdersService>();
builder.Services.AddSingleton<IEventService, EventService>();

// Add health checks
builder.Services.AddHealthChecks();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Orders API v1");
        c.RoutePrefix = "swagger";
    });
}

// Add request tracing middleware
app.Use(async (context, next) =>
{
    var traceId = Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N")[..16];
    var spanId = Activity.Current?.SpanId.ToString() ?? Guid.NewGuid().ToString("N")[..8];
    
    using (LogContext.PushProperty("trace_id", traceId))
    using (LogContext.PushProperty("span_id", spanId))
    using (LogContext.PushProperty("service", "orders"))
    {
        if (!context.Response.Headers.ContainsKey("X-Trace-Id"))
        {
            context.Response.Headers.Append("X-Trace-Id", traceId);
        }
        await next();
    }
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Add global exception handling
app.UseMiddleware<GlobalExceptionMiddleware>();

app.MapControllers();

// Root endpoint - service information
app.MapGet("/", () => new { name = "orders", version = "1.0.0" })
   .AllowAnonymous();

// OpenAPI JSON endpoint
app.MapGet("/openapi.json", (ISwaggerProvider swaggerProvider) =>
{
    var swagger = swaggerProvider.GetSwagger("v1");
    return Results.Json(swagger, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
})
.AllowAnonymous();

// Health check endpoints
app.MapHealthChecks("/healthz").AllowAnonymous();
app.MapHealthChecks("/readyz").AllowAnonymous();

Log.Information("Orders Service starting up...");

app.Run();
