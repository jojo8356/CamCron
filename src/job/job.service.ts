import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CameraService } from '../camera/camera.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cameraService: CameraService,
  ) {}

  async create(dto: CreateJobDto) {
    // Verify camera exists
    await this.cameraService.findOne(dto.cameraId);

    return this.prisma.job.create({
      data: {
        name: dto.name,
        cameraId: dto.cameraId,
        streamKey: dto.streamKey ?? 'main',
        action: dto.action,
        triggerType: dto.triggerType ?? 'continuous',
        cron: dto.cron,
        cronStop: dto.cronStop,
        duration: dto.duration,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        periodRecurrent: dto.periodRecurrent ?? false,
        outputDir: dto.outputDir,
        filePattern: dto.filePattern ?? '{cameraName}_{timestamp}',
        outputFormat: dto.outputFormat ?? 'mp4',
        segmentDuration: dto.segmentDuration,
        codec: dto.codec ?? 'copy',
        resolution: dto.resolution,
        quality: dto.quality,
        extraArgs: dto.extraArgs ? JSON.stringify(dto.extraArgs) : null,
        customCommand: dto.customCommand,
        commandTimeout: dto.commandTimeout,
        retentionDays: dto.retentionDays,
        retentionMaxGB: dto.retentionMaxGB,
        maxRetries: dto.maxRetries ?? 3,
        priority: dto.priority ?? 0,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async findAll(filters?: { cameraId?: string; action?: string; enabled?: boolean }) {
    return this.prisma.job.findMany({
      where: {
        ...(filters?.cameraId && { cameraId: filters.cameraId }),
        ...(filters?.action && { action: filters.action }),
        ...(filters?.enabled !== undefined && { enabled: filters.enabled }),
      },
      include: { camera: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { camera: true },
    });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async findEnabled() {
    return this.prisma.job.findMany({
      where: { enabled: true },
      include: { camera: true },
    });
  }

  async update(id: string, dto: UpdateJobDto) {
    await this.findOne(id);

    if (dto.cameraId) {
      await this.cameraService.findOne(dto.cameraId);
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.cameraId !== undefined && { cameraId: dto.cameraId }),
        ...(dto.streamKey !== undefined && { streamKey: dto.streamKey }),
        ...(dto.action !== undefined && { action: dto.action }),
        ...(dto.triggerType !== undefined && { triggerType: dto.triggerType }),
        ...(dto.cron !== undefined && { cron: dto.cron }),
        ...(dto.cronStop !== undefined && { cronStop: dto.cronStop }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.periodStart !== undefined && { periodStart: dto.periodStart }),
        ...(dto.periodEnd !== undefined && { periodEnd: dto.periodEnd }),
        ...(dto.periodRecurrent !== undefined && { periodRecurrent: dto.periodRecurrent }),
        ...(dto.outputDir !== undefined && { outputDir: dto.outputDir }),
        ...(dto.filePattern !== undefined && { filePattern: dto.filePattern }),
        ...(dto.outputFormat !== undefined && { outputFormat: dto.outputFormat }),
        ...(dto.segmentDuration !== undefined && { segmentDuration: dto.segmentDuration }),
        ...(dto.codec !== undefined && { codec: dto.codec }),
        ...(dto.resolution !== undefined && { resolution: dto.resolution }),
        ...(dto.quality !== undefined && { quality: dto.quality }),
        ...(dto.extraArgs !== undefined && { extraArgs: JSON.stringify(dto.extraArgs) }),
        ...(dto.customCommand !== undefined && { customCommand: dto.customCommand }),
        ...(dto.commandTimeout !== undefined && { commandTimeout: dto.commandTimeout }),
        ...(dto.retentionDays !== undefined && { retentionDays: dto.retentionDays }),
        ...(dto.retentionMaxGB !== undefined && { retentionMaxGB: dto.retentionMaxGB }),
        ...(dto.maxRetries !== undefined && { maxRetries: dto.maxRetries }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.job.delete({ where: { id } });
  }

  async createExecution(jobId: string) {
    return this.prisma.jobExecution.create({
      data: { jobId, status: 'running' },
    });
  }

  async completeExecution(
    executionId: string,
    status: string,
    exitCode?: number,
    error?: string,
  ) {
    return this.prisma.jobExecution.update({
      where: { id: executionId },
      data: {
        stoppedAt: new Date(),
        status,
        exitCode,
        error,
      },
    });
  }

  async getExecutionHistory(jobId: string, limit = 50) {
    return this.prisma.jobExecution.findMany({
      where: { jobId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}
