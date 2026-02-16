import { Module } from '@nestjs/common';
import { JobService } from './job.service.js';
import { CameraModule } from '../camera/camera.module.js';

@Module({
  imports: [CameraModule],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
