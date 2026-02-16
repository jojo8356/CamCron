/* Mock Prisma to avoid import.meta.url issue in Jest */
jest.mock('../prisma/prisma.service.js', () => ({
  PrismaService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JobController } from './job.controller.js';
import { JobService } from './job.service.js';
import { ProcessSupervisorService } from '../process/process-supervisor.service.js';
import { SchedulerService } from '../scheduler/scheduler.service.js';
import { DateTime } from 'luxon';

const mockJob = {
  id: 'job-1',
  name: 'Record Front',
  cameraId: 'cam-1',
  streamKey: 'main',
  action: 'record',
  triggerType: 'continuous',
  cron: '0 8 * * *',
  cronStop: '0 18 * * *',
  duration: null,
  periodStart: null,
  periodEnd: null,
  periodRecurrent: false,
  outputDir: '/recordings/{cameraName}/{date}',
  filePattern: '{cameraName}_{timestamp}',
  outputFormat: 'mp4',
  segmentDuration: 3600,
  codec: 'copy',
  resolution: null,
  quality: null,
  extraArgs: null,
  customCommand: null,
  commandTimeout: null,
  retentionDays: 30,
  retentionMaxGB: null,
  maxRetries: 3,
  priority: 0,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  camera: { id: 'cam-1', name: 'Front', streams: '{"main":"rtsp://x"}' },
};

const mockExecution = {
  id: 'exec-1',
  jobId: 'job-1',
  startedAt: new Date(),
  stoppedAt: null,
  status: 'running',
  exitCode: null,
  error: null,
  filesProduced: 0,
  bytesProduced: BigInt(0),
};

const mockJobService = {
  findAll: jest.fn().mockResolvedValue([mockJob]),
  findOne: jest.fn().mockResolvedValue(mockJob),
  create: jest.fn().mockResolvedValue(mockJob),
  update: jest.fn().mockResolvedValue(mockJob),
  remove: jest.fn().mockResolvedValue(mockJob),
  getExecutionHistory: jest.fn().mockResolvedValue([mockExecution]),
};

const mockProcessSupervisor = {
  getStatus: jest.fn().mockReturnValue({
    jobId: 'job-1',
    running: false,
    pid: null,
    startedAt: null,
    uptime: null,
    retries: 0,
    lastError: null,
  }),
  isRunning: jest.fn().mockReturnValue(false),
  spawnProcess: jest.fn().mockResolvedValue(undefined),
  killProcess: jest.fn().mockResolvedValue(undefined),
  getLogs: jest.fn().mockReturnValue(['[2026-02-16T10:00:00] Starting...']),
};

const nextTime = DateTime.fromISO('2026-02-17T08:00:00');
const mockSchedulerService = {
  getNextOccurrence: jest.fn().mockReturnValue(nextTime),
};

describe('JobController', () => {
  let controller: JobController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        { provide: JobService, useValue: mockJobService },
        { provide: ProcessSupervisorService, useValue: mockProcessSupervisor },
        { provide: SchedulerService, useValue: mockSchedulerService },
      ],
    }).compile();

    controller = module.get<JobController>(JobController);
    jest.clearAllMocks();
  });

  describe('GET /jobs', () => {
    it('should return all jobs', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockJob]);
      expect(mockJobService.findAll).toHaveBeenCalledWith({
        cameraId: undefined,
        action: undefined,
        enabled: undefined,
      });
    });

    it('should pass filters', async () => {
      await controller.findAll('cam-1', 'record', 'true');
      expect(mockJobService.findAll).toHaveBeenCalledWith({
        cameraId: 'cam-1',
        action: 'record',
        enabled: true,
      });
    });
  });

  describe('POST /jobs', () => {
    it('should create a job', async () => {
      const dto = { name: 'Test', cameraId: 'cam-1', action: 'record', cron: '* * * * *', outputDir: '/tmp' };
      const result = await controller.create(dto as any);
      expect(result).toEqual(mockJob);
    });
  });

  describe('GET /jobs/:id', () => {
    it('should return job with runtime status and nextOccurrence', async () => {
      mockJobService.findOne.mockResolvedValueOnce(mockJob);
      const result = await controller.findOne('job-1');
      expect(result).toHaveProperty('runtime');
      expect(result).toHaveProperty('nextOccurrence');
      expect(mockProcessSupervisor.getStatus).toHaveBeenCalledWith('job-1');
      expect(mockSchedulerService.getNextOccurrence).toHaveBeenCalledWith(mockJob);
    });
  });

  describe('PATCH /jobs/:id', () => {
    it('should update a job', async () => {
      const dto = { name: 'Updated' };
      await controller.update('job-1', dto as any);
      expect(mockJobService.update).toHaveBeenCalledWith('job-1', dto);
    });
  });

  describe('DELETE /jobs/:id', () => {
    it('should remove a job', async () => {
      await controller.remove('job-1');
      expect(mockJobService.remove).toHaveBeenCalledWith('job-1');
    });

    it('should kill process before removing if running', async () => {
      mockProcessSupervisor.isRunning.mockReturnValueOnce(true);
      await controller.remove('job-1');
      expect(mockProcessSupervisor.killProcess).toHaveBeenCalledWith('job-1');
      expect(mockJobService.remove).toHaveBeenCalledWith('job-1');
    });
  });

  describe('POST /jobs/:id/start', () => {
    it('should start a job', async () => {
      mockJobService.findOne.mockResolvedValueOnce(mockJob);
      const result = await controller.start('job-1');
      expect(result.message).toContain('started');
      expect(mockProcessSupervisor.spawnProcess).toHaveBeenCalledWith(mockJob);
    });
  });

  describe('POST /jobs/:id/stop', () => {
    it('should stop a job', async () => {
      const result = await controller.stop('job-1');
      expect(result.message).toContain('stop');
      expect(mockProcessSupervisor.killProcess).toHaveBeenCalledWith('job-1');
    });
  });

  describe('GET /jobs/:id/logs', () => {
    it('should return logs with default limit', () => {
      mockProcessSupervisor.getLogs.mockReturnValueOnce(['line1']);
      const result = controller.getLogs('job-1');
      expect(result).toEqual({ jobId: 'job-1', lines: ['line1'] });
      expect(mockProcessSupervisor.getLogs).toHaveBeenCalledWith('job-1', 100);
    });

    it('should pass custom limit', () => {
      controller.getLogs('job-1', '10');
      expect(mockProcessSupervisor.getLogs).toHaveBeenCalledWith('job-1', 10);
    });
  });

  describe('GET /jobs/:id/history', () => {
    it('should return execution history', async () => {
      const result = await controller.getHistory('job-1');
      expect(result).toEqual([mockExecution]);
      expect(mockJobService.getExecutionHistory).toHaveBeenCalledWith('job-1', 50);
    });

    it('should pass custom limit', async () => {
      await controller.getHistory('job-1', '5');
      expect(mockJobService.getExecutionHistory).toHaveBeenCalledWith('job-1', 5);
    });
  });
});
