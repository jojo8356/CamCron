import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DateTime } from 'luxon';
import { JobService } from '../job/job.service.js';
import { SchedulerService } from './scheduler.service.js';
import { ProcessSupervisorService } from '../process/process-supervisor.service.js';
import type { Job, Camera } from '../../generated/prisma/client.js';

@Injectable()
export class SchedulerEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerEngineService.name);
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private readonly TICK_INTERVAL_MS = 30_000; // 30 seconds

  constructor(
    private readonly jobService: JobService,
    private readonly schedulerService: SchedulerService,
    private readonly processSupervisor: ProcessSupervisorService,
  ) {}

  async onModuleInit() {
    this.start();
    // Immediate evaluation on startup to catch up
    await this.tick();
  }

  onModuleDestroy() {
    this.stop();
  }

  start(): void {
    if (this.tickInterval) return;
    this.logger.log(`Scheduler engine started (tick every ${this.TICK_INTERVAL_MS / 1000}s)`);
    this.tickInterval = setInterval(() => {
      void this.tick();
    }, this.TICK_INTERVAL_MS);
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      this.logger.log('Scheduler engine stopped');
    }
  }

  async tick(): Promise<void> {
    const now = DateTime.now();
    let jobs: (Job & { camera: Camera })[];

    try {
      jobs = await this.jobService.findEnabled() as (Job & { camera: Camera })[];
    } catch (err) {
      this.logger.error(`Failed to fetch jobs: ${err}`);
      return;
    }

    for (const job of jobs) {
      try {
        await this.evaluateJob(job, now);
      } catch (err) {
        this.logger.error(`Error evaluating job ${job.id}: ${err}`);
      }
    }
  }

  private async evaluateJob(job: Job & { camera: Camera }, now: DateTime): Promise<void> {
    const shouldRun = this.schedulerService.shouldJobRun(job, now);
    const isRunning = this.processSupervisor.isRunning(job.id);

    switch (job.triggerType) {
      case 'continuous':
        if (shouldRun && !isRunning) {
          this.logger.log(`Starting continuous job: ${job.name}`);
          await this.processSupervisor.spawnProcess(job);
        } else if (!shouldRun && isRunning) {
          this.logger.log(`Stopping continuous job: ${job.name}`);
          await this.processSupervisor.killProcess(job.id);
        }
        break;

      case 'oneshot':
        if (shouldRun && !isRunning) {
          this.logger.log(`Firing oneshot job: ${job.name}`);
          await this.processSupervisor.spawnProcess(job);
          // Process will terminate on its own
        }
        break;

      case 'fixed_duration':
        if (shouldRun && !isRunning) {
          const duration = job.duration ?? 60;
          this.logger.log(`Firing fixed_duration job: ${job.name} (${duration}s)`);
          await this.processSupervisor.spawnProcess(job);
          // Schedule kill after duration
          setTimeout(() => {
            void this.processSupervisor.killProcess(job.id);
          }, duration * 1000);
        }
        break;
    }
  }
}
