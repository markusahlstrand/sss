using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace OrdersService.Health;

[ApiController]
[Route("")]
public class HealthController : ControllerBase
{
    private readonly HealthCheckService _healthCheckService;

    public HealthController(HealthCheckService healthCheckService)
    {
        _healthCheckService = healthCheckService;
    }

    /// <summary>
    /// Liveness probe - indicates if the application is running
    /// </summary>
    [HttpGet("healthz")]
    public async Task<IActionResult> Liveness()
    {
        var result = await _healthCheckService.CheckHealthAsync();
        
        if (result.Status == HealthStatus.Healthy)
        {
            return Ok(new { status = "healthy" });
        }

        return StatusCode(503, new { status = "unhealthy" });
    }

    /// <summary>
    /// Readiness probe - indicates if the application is ready to serve requests
    /// </summary>
    [HttpGet("readyz")]
    public async Task<IActionResult> Readiness()
    {
        var result = await _healthCheckService.CheckHealthAsync();
        
        if (result.Status == HealthStatus.Healthy)
        {
            return Ok(new { status = "ready" });
        }

        return StatusCode(503, new { status = "not ready" });
    }
}
