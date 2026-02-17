import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DateTime } from 'luxon';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import type { Job, Camera } from '../generated/prisma/client.js';
import { CommandBuilderService } from './command-builder.service.js';
import { TemplateService } from '../template/template.service.js';
import { JobService } from '../job/job.service.js';
import type { ProcessEntry, ProcessStatus, LogBuffer } from '../common/interfaces.js';

@Injectable()
export class ProcessSupervisorService implements OnModuleDestroy {
  private readonly logger = new Logger(ProcessSupervisorService.name);
  private readonly processes = new Map<string, ProcessEntry>();
  private readonly logBuffers = new Map<string, LogBuffer>();
  private readonly LOG_MAX_LINES = 500;

  constructor(
    private readonly commandBuilder: CommandBuilderService,
    private readonly templateService: TemplateService,
    private readonly jobService: JobService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleDestroy() {
    await this.killAll();
  }

  async spawnProcess(job: Job & { camera: Camera }): Promise<void> {
    if (this.processes.has(job.id)) {
      this.logger.debug(`Job ${job.id} already running, skipping spawn`);
      return;
    }

    const camera = job.camera;
    const streams: Record<string, string> =
      typeof camera.streams === 'string' ? JSON.parse(camera.streams) : {};

    // Resolve output directory
    const outputDir = this.templateService.resolveForJob(job.outputDir, {
      cameraId: camera.id,
      cameraName: camera.name,
      jobId: job.id,
      jobName: job.name,
    });
    await this.templateService.ensureOutputDirectory(outputDir);

    // Build command
    const spec = this.commandBuilder.build(job, camera, outputDir);

    // Create execution record
    const execution = await this.jobService.createExecution(job.id);

    this.logger.log(`Spawning [${job.name}]: ${spec.command} ${spec.args.join(' ')}`);

    const child = spawn(spec.command, spec.args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const entry: ProcessEntry = {
      jobId: job.id,
      process: child,
      startedAt: new Date(),
      retries: 0,
      executionId: execution.id,
    };
    this.processes.set(job.id, entry);

    // Init log buffer
    this.logBuffers.set(job.id, {
      jobId: job.id,
      lines: [],
      maxLines: this.LOG_MAX_LINES,
    });

    // Capture stdout/stderr
    child.stdout?.on('data', (data: Buffer) => {
      this.appendLog(job.id, data.toString());
    });
    child.stderr?.on('data', (data: Buffer) => {
      this.appendLog(job.id, data.toString());
    });

    // Handle exit
    child.on('exit', (code, signal) => {
      this.handleExit(job, entry, code, signal);
    });

    child.on('error', (err) => {
      this.logger.error(`Process error for job ${job.id}: ${err.message}`);
      this.appendLog(job.id, `ERROR: ${err.message}`);
      this.handleExit(job, entry, 1, null);
    });

    this.eventEmitter.emit('job:started', {
      jobId: job.id,
      jobName: job.name,
      pid: child.pid,
    });
  }

  private async handleExit(
    job: Job & { camera: Camera },
    entry: ProcessEntry,
    code: number | null,
    signal: string | null,
  ): Promise<void> {
    this.processes.delete(job.id);

    const status = code === 0 ? 'completed' : signal === 'SIGTERM' ? 'killed' : 'error';
    const errorMsg = code !== 0 && code !== null ? `Exit code: ${code}` : signal ? `Signal: ${signal}` : null;

    await this.jobService.completeExecution(entry.executionId, status, code ?? undefined, errorMsg ?? undefined);

    this.logger.log(`Job ${job.name} exited: status=${status}, code=${code}, signal=${signal}`);

    this.eventEmitter.emit('job:stopped', {
      jobId: job.id,
      jobName: job.name,
      status,
      code,
      signal,
    });

    // Auto-retry for error exits on continuous/fixed_duration jobs
    if (status === 'error' && entry.retries < job.maxRetries && job.triggerType !== 'oneshot') {
      entry.retries++;
      this.logger.warn(`Retrying job ${job.name} (${entry.retries}/${job.maxRetries})`);
      this.eventEmitter.emit('job:retry', {
        jobId: job.id,
        jobName: job.name,
        retry: entry.retries,
        maxRetries: job.maxRetries,
      });

      // Delay retry by 5 seconds
      setTimeout(() => {
        void this.spawnProcess(job);
      }, 5000);
    }
  }

  async killProcess(jobId: string): Promise<void> {
    const entry = this.processes.get(jobId);
    if (!entry) return;

    this.logger.log(`Killing process for job ${jobId} (pid: ${entry.process.pid})`);

    // Graceful stop
    entry.process.kill('SIGTERM');

    // Force kill after 10 seconds
    const forceKillTimeout = setTimeout(() => {
      if (this.processes.has(jobId)) {
        this.logger.warn(`Force killing job ${jobId}`);
        entry.process.kill('SIGKILL');
      }
    }, 10_000);

    entry.process.on('exit', () => {
      clearTimeout(forceKillTimeout);
    });
  }

  async killAll(): Promise<void> {
    this.logger.log(`Stopping all processes (${this.processes.size} active)`);
    const promises = Array.from(this.processes.keys()).map((id) => this.killProcess(id));
    await Promise.all(promises);
  }

  isRunning(jobId: string): boolean {
    return this.processes.has(jobId);
  }

  getStatus(jobId: string): ProcessStatus {
    const entry = this.processes.get(jobId);
    if (!entry) {
      return {
        jobId,
        running: false,
        pid: null,
        startedAt: null,
        uptime: null,
        retries: 0,
        lastError: null,
      };
    }

    return {
      jobId,
      running: true,
      pid: entry.process.pid ?? null,
      startedAt: entry.startedAt,
      uptime: Date.now() - entry.startedAt.getTime(),
      retries: entry.retries,
      lastError: null,
    };
  }

  getAllStatuses(): ProcessStatus[] {
    return Array.from(this.processes.keys()).map((id) => this.getStatus(id));
  }

  getActiveCount(): number {
    return this.processes.size;
  }

  getLogs(jobId: string, limit = 100): string[] {
    const buffer = this.logBuffers.get(jobId);
    if (!buffer) return [];
    return buffer.lines.slice(-limit);
  }

  private appendLog(jobId: string, data: string): void {
    const buffer = this.logBuffers.get(jobId);
    if (!buffer) return;

    const lines = data.split('\n').filter((l) => l.trim());
    for (const line of lines) {
      const timestamped = `[${DateTime.now().toISO()}] ${line}`;
      buffer.lines.push(timestamped);
      if (buffer.lines.length > buffer.maxLines) {
        buffer.lines.shift();
      }

      this.eventEmitter.emit('job:log', { jobId, line: timestamped });
    }
  }
}
