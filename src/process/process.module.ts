import { Module } from '@nestjs/common';
import { ProcessSupervisorService } from './process-supervisor.service.js';
import { CommandBuilderService } from './command-builder.service.js';
import { JobModule } from '../job/job.module.js';

@Module({
  imports: [JobModule],
  providers: [ProcessSupervisorService, CommandBuilderService],
  exports: [ProcessSupervisorService, CommandBuilderService],
})
export class ProcessModule {}
