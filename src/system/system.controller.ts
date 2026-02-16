import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SystemService } from './system.service.js';

@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  getHealth() {
    return this.systemService.getHealth();
  }

  @Get('status')
  getStatus() {
    return this.systemService.getStatus();
  }

  @Get('settings')
  getSettings() {
    return this.systemService.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() data: Record<string, unknown>) {
    return this.systemService.updateSettings(data);
  }
}
