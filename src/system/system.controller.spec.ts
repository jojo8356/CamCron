/* Mock Prisma to avoid import.meta.url issue in Jest */
jest.mock('../prisma/prisma.service.js', () => ({
  PrismaService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from './system.controller.js';
import { SystemService } from './system.service.js';

const mockSystemService = {
  getHealth: jest.fn().mockReturnValue({
    status: 'ok',
    uptime: 60000,
    startedAt: '2026-02-16T10:00:00.000Z',
  }),
  getStatus: jest.fn().mockResolvedValue({
    cameras: 3,
    jobs: 5,
    activeProcesses: 2,
    runningJobs: [],
    uptime: 60000,
    ffmpegVersion: 'ffmpeg version 6.0',
  }),
  getSettings: jest.fn().mockResolvedValue({
    recordingsDir: '/data/recordings',
    retentionDays: 30,
  }),
  updateSettings: jest.fn().mockResolvedValue({
    recordingsDir: '/data/recordings',
    retentionDays: 60,
  }),
};

describe('SystemController', () => {
  let controller: SystemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        { provide: SystemService, useValue: mockSystemService },
      ],
    }).compile();

    controller = module.get<SystemController>(SystemController);
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', () => {
      const result = controller.getHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('startedAt');
    });
  });

  describe('GET /status', () => {
    it('should return system status', async () => {
      const result = await controller.getStatus();
      expect(result).toHaveProperty('cameras', 3);
      expect(result).toHaveProperty('jobs', 5);
      expect(result).toHaveProperty('activeProcesses', 2);
      expect(result).toHaveProperty('ffmpegVersion');
      expect(mockSystemService.getStatus).toHaveBeenCalled();
    });
  });

  describe('GET /settings', () => {
    it('should return all settings', async () => {
      const result = await controller.getSettings();
      expect(result).toHaveProperty('recordingsDir');
      expect(mockSystemService.getSettings).toHaveBeenCalled();
    });
  });

  describe('PATCH /settings', () => {
    it('should update settings', async () => {
      const data = { retentionDays: 60 };
      const result = await controller.updateSettings(data);
      expect(result).toHaveProperty('retentionDays', 60);
      expect(mockSystemService.updateSettings).toHaveBeenCalledWith(data);
    });
  });
});
