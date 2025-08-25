import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Service Info')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Get service information' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'orders' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  getServiceInfo() {
    return {
      name: 'orders',
      version: '1.0.0'
    };
  }
}
