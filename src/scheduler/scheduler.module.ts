import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service.js';
import { SchedulerEngineService } from './scheduler-engine.service.js';
import { JobModule } from '../job/job.module.js';
import { ProcessModule } from '../process/process.module.js';

@Module({
  imports: [JobModule, ProcessModule],
  providers: [SchedulerService, SchedulerEngineService],
  exports: [SchedulerService, SchedulerEngineService],
})
export class SchedulerModule {}
