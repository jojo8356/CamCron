import { Test, TestingModule } from '@nestjs/testing';
import { CommandBuilderService } from './command-builder.service.js';
import type { Job, Camera } from '../generated/prisma/client.js';

describe('CommandBuilderService', () => {
  let service: CommandBuilderService;

  const mockCamera: Camera = {
    id: 'cam-1',
    name: 'Test Camera',
    protocol: 'rtsp',
    streams: JSON.stringify({ main: 'rtsp://192.168.1.100/stream1', sub: 'rtsp://192.168.1.100/stream2' }),
    username: 'admin',
    password: 'pass',
    tags: null,
    location: null,
    model: null,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseJob: Job = {
    id: 'job-1',
    name: 'Test Job',
    cameraId: 'cam-1',
    streamKey: 'main',
    action: 'record',
    triggerType: 'continuous',
    cron: '* * * * *',
    cronStop: null,
    duration: null,
    periodStart: null,
    periodEnd: null,
    periodRecurrent: false,
    outputDir: '/tmp/test',
    filePattern: '{timestamp}',
    outputFormat: 'mp4',
    segmentDuration: null,
    codec: 'copy',
    resolution: null,
    quality: null,
    extraArgs: null,
    customCommand: null,
    commandTimeout: null,
    retentionDays: null,
    retentionMaxGB: null,
    maxRetries: 3,
    priority: 0,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandBuilderService],
    }).compile();

    service = module.get<CommandBuilderService>(CommandBuilderService);
  });

  describe('build - record', () => {
    it('should build an ffmpeg record command with codec copy', () => {
      const spec = service.build(baseJob, mockCamera, '/tmp/output');
      expect(spec.command).toBe('ffmpeg');
      expect(spec.args).toContain('-i');
      expect(spec.args).toContain('rtsp://192.168.1.100/stream1');
      expect(spec.args).toContain('-c');
      expect(spec.args).toContain('copy');
    });

    it('should use segment format when segmentDuration is set', () => {
      const job = { ...baseJob, segmentDuration: 3600 };
      const spec = service.build(job, mockCamera, '/tmp/output');
      expect(spec.args).toContain('-f');
      expect(spec.args).toContain('segment');
      expect(spec.args).toContain('-segment_time');
      expect(spec.args).toContain('3600');
    });

    it('should include extra args', () => {
      const job = { ...baseJob, extraArgs: JSON.stringify(['-rtsp_transport', 'tcp']) };
      const spec = service.build(job, mockCamera, '/tmp/output');
      expect(spec.args).toContain('-rtsp_transport');
      expect(spec.args).toContain('tcp');
    });
  });

  describe('build - snapshot', () => {
    it('should build an ffmpeg snapshot command', () => {
      const job = { ...baseJob, action: 'snapshot', outputFormat: 'jpg' };
      const spec = service.build(job, mockCamera, '/tmp/output');
      expect(spec.command).toBe('ffmpeg');
      expect(spec.args).toContain('-frames:v');
      expect(spec.args).toContain('1');
    });
  });

  describe('build - test_connection', () => {
    it('should build an ffprobe command', () => {
      const job = { ...baseJob, action: 'test_connection' };
      const spec = service.build(job, mockCamera, '/tmp/output');
      expect(spec.command).toBe('ffprobe');
      expect(spec.args).toContain('-show_streams');
      expect(spec.args).toContain('rtsp://192.168.1.100/stream1');
    });
  });

  describe('build - custom_command', () => {
    it('should build a custom command with stream URL replacement', () => {
      const job = {
        ...baseJob,
        action: 'custom_command',
        customCommand: 'ffprobe -v quiet {streamUrl}',
      };
      const spec = service.build(job, mockCamera, '/tmp/output');
      expect(spec.command).toBe('ffprobe');
      expect(spec.args).toContain('rtsp://192.168.1.100/stream1');
    });

    it('should throw if no custom command is set', () => {
      const job = { ...baseJob, action: 'custom_command', customCommand: null };
      expect(() => service.build(job, mockCamera, '/tmp/output')).toThrow();
    });
  });

  describe('build - sub stream', () => {
    it('should use sub stream when specified', () => {
      const job = { ...baseJob, streamKey: 'sub' };
      const spec = service.build(job, mockCamera, '/tmp/output');
      expect(spec.args).toContain('rtsp://192.168.1.100/stream2');
    });
  });
});
