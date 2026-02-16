import { Module } from '@nestjs/common';
import { CameraController } from './camera.controller.js';
import { CameraService } from './camera.service.js';

@Module({
  controllers: [CameraController],
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}
