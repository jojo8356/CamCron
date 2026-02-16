import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProcessSupervisorService } from '../process/process-supervisor.service.js';
import { execSync } from 'node:child_process';

@Injectable()
export class SystemService {
  private readonly startedAt = new Date();

  constructor(
    private readonly prisma: PrismaService,
    private readonly processSupervisor: ProcessSupervisorService,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      uptime: Date.now() - this.startedAt.getTime(),
      startedAt: this.startedAt.toISOString(),
    };
  }

  async getStatus() {
    const [cameraCount, jobCount] = await Promise.all([
      this.prisma.camera.count(),
      this.prisma.job.count(),
    ]);

    let ffmpegVersion: string | null = null;
    try {
      ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf-8' })
        .split('\n')[0];
    } catch {
      ffmpegVersion = null;
    }

    return {
      cameras: cameraCount,
      jobs: jobCount,
      activeProcesses: this.processSupervisor.getActiveCount(),
      runningJobs: this.processSupervisor.getAllStatuses(),
      uptime: Date.now() - this.startedAt.getTime(),
      ffmpegVersion,
    };
  }

  async getSettings() {
    const settings = await this.prisma.appSetting.findMany();
    const result: Record<string, unknown> = {};
    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    }
    return result;
  }

  async updateSettings(data: Record<string, unknown>) {
    const operations = Object.entries(data).map(([key, value]) =>
      this.prisma.appSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      }),
    );
    await Promise.all(operations);
    return this.getSettings();
  }
}
