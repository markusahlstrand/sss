import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Health")
@Controller()
export class HealthController {
  @Get("healthz")
  @ApiOperation({ summary: "Liveness probe" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  healthCheck() {
    return { status: "ok" };
  }

  @Get("readyz")
  @ApiOperation({ summary: "Readiness probe" })
  @ApiResponse({ status: 200, description: "Service is ready" })
  @ApiResponse({ status: 503, description: "Service is not ready" })
  readinessCheck() {
    // Add any readiness checks here (database connections, etc.)
    return { status: "ok" };
  }
}
