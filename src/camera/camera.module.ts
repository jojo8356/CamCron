import { Module } from '@nestjs/common';
import { CameraService } from './camera.service.js';

@Module({
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}
