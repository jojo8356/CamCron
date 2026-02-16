import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module.js';
import { CameraModule } from './camera/camera.module.js';
import { JobModule } from './job/job.module.js';
import { TemplateModule } from './template/template.module.js';
import { SchedulerModule } from './scheduler/scheduler.module.js';
import { ProcessModule } from './process/process.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    TemplateModule,
    CameraModule,
    JobModule,
    ProcessModule,
    SchedulerModule,
  ],
})
export class AppModule {}
