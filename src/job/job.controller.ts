import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { JobService } from './job.service.js';
import { ProcessSupervisorService } from '../process/process-supervisor.service.js';
import { SchedulerService } from '../scheduler/scheduler.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import type { Job, Camera } from '../../generated/prisma/client.js';

@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly processSupervisor: ProcessSupervisorService,
    private readonly schedulerService: SchedulerService,
  ) {}

  @Get()
  findAll(
    @Query('cameraId') cameraId?: string,
    @Query('action') action?: string,
    @Query('enabled') enabled?: string,
  ) {
    return this.jobService.findAll({
      cameraId,
      action,
      enabled: enabled !== undefined ? enabled === 'true' : undefined,
    });
  }

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const job = await this.jobService.findOne(id);
    const status = this.processSupervisor.getStatus(id);
    const nextOccurrence = this.schedulerService.getNextOccurrence(job);

    return {
      ...job,
      runtime: status,
      nextOccurrence: nextOccurrence?.toISO() ?? null,
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (this.processSupervisor.isRunning(id)) {
      await this.processSupervisor.killProcess(id);
    }
    return this.jobService.remove(id);
  }

  @Post(':id/start')
  async start(@Param('id') id: string) {
    const job = await this.jobService.findOne(id);
    await this.processSupervisor.spawnProcess(job as Job & { camera: Camera });
    return { message: `Job ${job.name} started` };
  }

  @Post(':id/stop')
  async stop(@Param('id') id: string) {
    await this.processSupervisor.killProcess(id);
    return { message: `Job ${id} stop requested` };
  }

  @Get(':id/logs')
  getLogs(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const lines = this.processSupervisor.getLogs(
      id,
      limit ? parseInt(limit, 10) : 100,
    );
    return { jobId: id, lines };
  }

  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.jobService.getExecutionHistory(
      id,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
