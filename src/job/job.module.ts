import { Module, forwardRef } from '@nestjs/common';
import { JobController } from './job.controller.js';
import { JobService } from './job.service.js';
import { CameraModule } from '../camera/camera.module.js';
import { ProcessModule } from '../process/process.module.js';
import { SchedulerModule } from '../scheduler/scheduler.module.js';

@Module({
  imports: [
    CameraModule,
    forwardRef(() => ProcessModule),
    forwardRef(() => SchedulerModule),
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
