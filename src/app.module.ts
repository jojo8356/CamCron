import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { PrismaModule } from './prisma/prisma.module.js';
import { CameraModule } from './camera/camera.module.js';
import { JobModule } from './job/job.module.js';
import { TemplateModule } from './template/template.module.js';
import { SchedulerModule } from './scheduler/scheduler.module.js';
import { ProcessModule } from './process/process.module.js';
import { SystemModule } from './system/system.module.js';
import { EventsModule } from './events/events.module.js';
import { FileModule } from './file/file.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'web', 'dist'),
      exclude: ['/api/(.*)', '/socket.io/(.*)'],
    }),
    PrismaModule,
    TemplateModule,
    CameraModule,
    JobModule,
    ProcessModule,
    SchedulerModule,
    SystemModule,
    EventsModule,
    FileModule,
  ],
})
export class AppModule {}
