import { Test, TestingModule } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { SchedulerService } from './scheduler.service.js';
import type { Job } from '../generated/prisma/client.js';

describe('SchedulerService', () => {
  let service: SchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchedulerService],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
  });

  describe('cronMatchesNow', () => {
    it('should match when cron fires at the current minute', () => {
      const now = DateTime.now().startOf('minute');
      expect(service.cronMatchesNow('* * * * *', now)).toBe(true);
    });

    it('should not match a cron far from now', () => {
      const now = DateTime.fromISO('2026-07-15T14:30:00');
      expect(service.cronMatchesNow('0 0 1 1 *', now)).toBe(false);
    });

    it('should match a specific hour cron at the right time', () => {
      const now = DateTime.fromISO('2026-06-10T09:00:00');
      expect(service.cronMatchesNow('0 9 * * *', now)).toBe(true);
    });

    it('should not match a specific hour cron at wrong time', () => {
      const now = DateTime.fromISO('2026-06-10T10:00:00');
      expect(service.cronMatchesNow('0 9 * * *', now)).toBe(false);
    });
  });

  describe('isWithinPeriod', () => {
    it('should return true when no period is set', () => {
      expect(service.isWithinPeriod(DateTime.now(), null, null, false)).toBe(true);
    });

    it('should return true for a date within a fixed period', () => {
      const now = DateTime.fromISO('2026-04-15');
      expect(service.isWithinPeriod(now, '2026-03-15', '2026-04-30', false)).toBe(true);
    });

    it('should return false for a date outside a fixed period', () => {
      const now = DateTime.fromISO('2026-05-15');
      expect(service.isWithinPeriod(now, '2026-03-15', '2026-04-30', false)).toBe(false);
    });

    it('should handle recurrent period within the same year', () => {
      const now = DateTime.fromISO('2026-04-15');
      expect(service.isWithinPeriod(now, '--03-15', '--04-30', true)).toBe(true);
    });

    it('should handle recurrent period outside range', () => {
      const now = DateTime.fromISO('2026-06-15');
      expect(service.isWithinPeriod(now, '--03-15', '--04-30', true)).toBe(false);
    });

    it('should handle cross-year recurrent period (Nov→Mar) in February', () => {
      const now = DateTime.fromISO('2026-02-15');
      expect(service.isWithinPeriod(now, '--11-15', '--03-15', true)).toBe(true);
    });

    it('should handle cross-year recurrent period (Nov→Mar) in December', () => {
      const now = DateTime.fromISO('2026-12-01');
      expect(service.isWithinPeriod(now, '--11-15', '--03-15', true)).toBe(true);
    });

    it('should handle cross-year recurrent period (Nov→Mar) in June (outside)', () => {
      const now = DateTime.fromISO('2026-06-15');
      expect(service.isWithinPeriod(now, '--11-15', '--03-15', true)).toBe(false);
    });

    it('should handle edge: exact start date', () => {
      const now = DateTime.fromISO('2026-03-15');
      expect(service.isWithinPeriod(now, '2026-03-15', '2026-04-30', false)).toBe(true);
    });

    it('should handle edge: exact end date', () => {
      const now = DateTime.fromISO('2026-04-30T23:59:00');
      expect(service.isWithinPeriod(now, '2026-03-15', '2026-04-30', false)).toBe(true);
    });
  });

  describe('shouldJobRun', () => {
    const baseJob: Job = {
      id: 'test-job',
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

    it('should return true for continuous job with no stop cron, no period', () => {
      expect(service.shouldJobRun(baseJob)).toBe(true);
    });

    it('should return false when outside calendar period', () => {
      const job = { ...baseJob, periodStart: '2026-01-01', periodEnd: '2026-01-31' };
      expect(service.shouldJobRun(job, DateTime.fromISO('2026-06-15'))).toBe(false);
    });

    it('should return true for continuous job within cron window', () => {
      const job = { ...baseJob, cron: '0 8 * * *', cronStop: '0 18 * * *' };
      expect(service.shouldJobRun(job, DateTime.fromISO('2026-02-16T14:00:00'))).toBe(true);
    });

    it('should return false for continuous job outside cron window', () => {
      const job = { ...baseJob, cron: '0 8 * * *', cronStop: '0 18 * * *' };
      expect(service.shouldJobRun(job, DateTime.fromISO('2026-02-16T22:00:00'))).toBe(false);
    });

    it('should combine period + cron correctly', () => {
      const job = {
        ...baseJob,
        cron: '0 8 * * *',
        cronStop: '0 18 * * *',
        periodStart: '--03-01',
        periodEnd: '--09-30',
        periodRecurrent: true,
      };
      // In period + in cron window
      expect(service.shouldJobRun(job, DateTime.fromISO('2026-06-15T12:00:00'))).toBe(true);
      // In period + outside cron window
      expect(service.shouldJobRun(job, DateTime.fromISO('2026-06-15T22:00:00'))).toBe(false);
      // Outside period
      expect(service.shouldJobRun(job, DateTime.fromISO('2026-11-15T12:00:00'))).toBe(false);
    });
  });

  describe('getNextOccurrence', () => {
    it('should return a future DateTime', () => {
      const job = { id: 'test', cron: '0 * * * *' } as Job;
      const next = service.getNextOccurrence(job);
      expect(next).not.toBeNull();
      expect(next!.toMillis()).toBeGreaterThan(DateTime.now().toMillis());
    });

    it('should return null for an invalid cron', () => {
      const job = { id: 'test', cron: 'invalid' } as Job;
      expect(service.getNextOccurrence(job)).toBeNull();
    });
  });
});
