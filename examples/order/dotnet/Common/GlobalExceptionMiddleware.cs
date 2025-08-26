using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Text.Json;

namespace OrdersService.Common;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var response = context.Response;
        response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Instance = context.Request.Path
        };

        switch (ex)
        {
            case ValidationException:
                problemDetails.Type = "validation_error";
                problemDetails.Title = "Validation Error";
                problemDetails.Status = (int)HttpStatusCode.BadRequest;
                problemDetails.Detail = ex.Message;
                break;

            case UnauthorizedException:
                problemDetails.Type = "unauthorized";
                problemDetails.Title = "Unauthorized";
                problemDetails.Status = (int)HttpStatusCode.Unauthorized;
                problemDetails.Detail = ex.Message;
                break;

            case ForbiddenException:
                problemDetails.Type = "forbidden";
                problemDetails.Title = "Forbidden";
                problemDetails.Status = (int)HttpStatusCode.Forbidden;
                problemDetails.Detail = ex.Message;
                break;

            case NotFoundException:
                problemDetails.Type = "not_found";
                problemDetails.Title = "Not Found";
                problemDetails.Status = (int)HttpStatusCode.NotFound;
                problemDetails.Detail = ex.Message;
                break;

            case ConflictException:
                problemDetails.Type = "conflict";
                problemDetails.Title = "Conflict";
                problemDetails.Status = (int)HttpStatusCode.Conflict;
                problemDetails.Detail = ex.Message;
                break;

            default:
                problemDetails.Type = "internal_error";
                problemDetails.Title = "Internal Server Error";
                problemDetails.Status = (int)HttpStatusCode.InternalServerError;
                problemDetails.Detail = "An unexpected error occurred";
                
                _logger.LogError(ex, "Unhandled exception occurred");
                break;
        }

        response.StatusCode = problemDetails.Status.Value;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(problemDetails, jsonOptions);
        await response.WriteAsync(json);
    }
}
