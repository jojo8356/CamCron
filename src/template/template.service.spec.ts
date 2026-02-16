import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service.js';

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateService],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  describe('resolve', () => {
    it('should replace known variables', () => {
      const result = service.resolve('/data/{cameraName}/{jobName}', {
        cameraName: 'Garage',
        jobName: 'record-hd',
      });
      expect(result).toBe('/data/Garage/record-hd');
    });

    it('should replace temporal variables', () => {
      const result = service.resolve('/data/{year}/{month}/{day}', {});
      const now = new Date();
      expect(result).toContain(String(now.getFullYear()));
    });

    it('should leave unknown variables untouched', () => {
      const result = service.resolve('/data/{unknown}', {});
      expect(result).toBe('/data/{unknown}');
    });

    it('should handle mixed variables', () => {
      const result = service.resolve('{cameraName}_{year}_{unknown}', {
        cameraName: 'cam1',
      });
      expect(result).toMatch(/^cam1_\d{4}_\{unknown\}$/);
    });
  });

  describe('resolveForJob', () => {
    it('should resolve all job context variables', () => {
      const result = service.resolveForJob(
        '/data/{cameraName}/{jobName}/{date}',
        {
          cameraId: 'cam-1',
          cameraName: 'Caméra Garage',
          jobId: 'job-1',
          jobName: 'Enregistrement HD',
        },
      );
      expect(result).toContain('Caméra Garage');
      expect(result).toContain('Enregistrement HD');
    });

    it('should sanitize path-unsafe characters', () => {
      const result = service.resolveForJob('{cameraName}', {
        cameraId: 'c1',
        cameraName: 'cam<>:"/\\|?*test',
        jobId: 'j1',
        jobName: 'job',
      });
      expect(result).not.toMatch(/[<>:"/\\|?*]/);
    });
  });
});
