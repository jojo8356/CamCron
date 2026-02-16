import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CameraService } from './camera.service.js';
import { CreateCameraDto } from './dto/create-camera.dto.js';
import { UpdateCameraDto } from './dto/update-camera.dto.js';
import { execSync } from 'node:child_process';

@Controller('cameras')
export class CameraController {
  constructor(private readonly cameraService: CameraService) {}

  @Get()
  findAll() {
    return this.cameraService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCameraDto) {
    return this.cameraService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cameraService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCameraDto) {
    return this.cameraService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cameraService.remove(id);
  }

  @Post(':id/test')
  async testConnection(@Param('id') id: string) {
    const camera = await this.cameraService.findOne(id);
    const streams = camera.streams as Record<string, string>;
    const streamUrl = streams['main'] ?? Object.values(streams)[0];

    if (!streamUrl) {
      return { success: false, error: 'No stream URL configured' };
    }

    try {
      const output = execSync(
        `ffprobe -v quiet -print_format json -show_streams -timeout 10000000 "${streamUrl}"`,
        { encoding: 'utf-8', timeout: 15_000 },
      );
      const parsed = JSON.parse(output);
      return {
        success: true,
        streams: parsed.streams,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Connection test failed';
      return { success: false, error: message };
    }
  }
}
