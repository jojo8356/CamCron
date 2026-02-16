/* Mock Prisma to avoid import.meta.url issue in Jest */
jest.mock('../prisma/prisma.service.js', () => ({
  PrismaService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CameraController } from './camera.controller.js';
import { CameraService } from './camera.service.js';

const mockCamera = {
  id: 'cam-1',
  name: 'Front Door',
  protocol: 'rtsp',
  streams: { main: 'rtsp://192.168.1.10/stream1' },
  username: null,
  password: null,
  tags: ['outdoor'],
  location: 'Entrance',
  model: null,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCameraService = {
  findAll: jest.fn().mockResolvedValue([mockCamera]),
  findOne: jest.fn().mockResolvedValue(mockCamera),
  create: jest.fn().mockResolvedValue(mockCamera),
  update: jest.fn().mockResolvedValue(mockCamera),
  remove: jest.fn().mockResolvedValue(mockCamera),
};

describe('CameraController', () => {
  let controller: CameraController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CameraController],
      providers: [
        { provide: CameraService, useValue: mockCameraService },
      ],
    }).compile();

    controller = module.get<CameraController>(CameraController);
    jest.clearAllMocks();
  });

  describe('GET /cameras', () => {
    it('should return all cameras', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockCamera]);
      expect(mockCameraService.findAll).toHaveBeenCalled();
    });
  });

  describe('POST /cameras', () => {
    it('should create a camera', async () => {
      const dto = {
        name: 'Front Door',
        streams: { main: 'rtsp://192.168.1.10/stream1' },
      };
      const result = await controller.create(dto as any);
      expect(result).toEqual(mockCamera);
      expect(mockCameraService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('GET /cameras/:id', () => {
    it('should return a camera by id', async () => {
      const result = await controller.findOne('cam-1');
      expect(result).toEqual(mockCamera);
      expect(mockCameraService.findOne).toHaveBeenCalledWith('cam-1');
    });
  });

  describe('PATCH /cameras/:id', () => {
    it('should update a camera', async () => {
      const dto = { name: 'Updated' };
      const result = await controller.update('cam-1', dto as any);
      expect(result).toEqual(mockCamera);
      expect(mockCameraService.update).toHaveBeenCalledWith('cam-1', dto);
    });
  });

  describe('DELETE /cameras/:id', () => {
    it('should remove a camera', async () => {
      const result = await controller.remove('cam-1');
      expect(result).toEqual(mockCamera);
      expect(mockCameraService.remove).toHaveBeenCalledWith('cam-1');
    });
  });

  describe('POST /cameras/:id/test', () => {
    it('should return error when no stream URL configured', async () => {
      mockCameraService.findOne.mockResolvedValueOnce({
        ...mockCamera,
        streams: {},
      });
      const result = await controller.testConnection('cam-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No stream URL configured');
    });

    it('should return error when ffprobe fails', async () => {
      const result = await controller.testConnection('cam-1');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
