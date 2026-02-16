import { Module } from '@nestjs/common';
import { SystemController } from './system.controller.js';
import { SystemService } from './system.service.js';
import { ProcessModule } from '../process/process.module.js';

@Module({
  imports: [ProcessModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
