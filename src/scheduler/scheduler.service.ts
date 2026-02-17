import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CronExpressionParser } from 'cron-parser';
import type { Job } from '../generated/prisma/client.js';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  /**
   * Check if a cron expression matches the current minute.
   */
  cronMatchesNow(cronExpr: string, now: DateTime = DateTime.now()): boolean {
    try {
      const startOfMinute = now.startOf('minute');
      const checkDate = startOfMinute.plus({ milliseconds: 1 }).toJSDate();
      const interval = CronExpressionParser.parse(cronExpr, { currentDate: checkDate });
      const prev = DateTime.fromJSDate(interval.prev().toDate());

      return Math.abs(startOfMinute.diff(prev, 'seconds').seconds) < 60;
    } catch {
      this.logger.warn(`Invalid cron expression: ${cronExpr}`);
      return false;
    }
  }

  /**
   * Check if the current date is within a calendar period.
   * Supports fixed dates ("2026-03-15") and recurring month-day ("--12-01").
   */
  isWithinPeriod(
    now: DateTime,
    periodStart: string | null,
    periodEnd: string | null,
    recurrent: boolean,
  ): boolean {
    if (!periodStart || !periodEnd) return true;

    if (recurrent) {
      return this.isWithinRecurrentPeriod(now, periodStart, periodEnd);
    }

    const start = DateTime.fromISO(periodStart).startOf('day');
    const end = DateTime.fromISO(periodEnd).endOf('day');
    return now >= start && now <= end;
  }

  private isWithinRecurrentPeriod(now: DateTime, startStr: string, endStr: string): boolean {
    const startMD = this.parseMonthDay(startStr);
    const endMD = this.parseMonthDay(endStr);
    if (!startMD || !endMD) return true;

    const nowMD = { month: now.month, day: now.day };

    // Same year range (e.g., Mar 15 → Apr 30)
    if (startMD.month <= endMD.month) {
      return this.mdCompare(nowMD, startMD) >= 0 && this.mdCompare(nowMD, endMD) <= 0;
    }
    // Cross-year range (e.g., Nov 15 → Mar 15)
    return this.mdCompare(nowMD, startMD) >= 0 || this.mdCompare(nowMD, endMD) <= 0;
  }

  private parseMonthDay(str: string): { month: number; day: number } | null {
    const recurring = str.match(/^--(\d{2})-(\d{2})$/);
    if (recurring) return { month: +recurring[1], day: +recurring[2] };

    const full = DateTime.fromISO(str);
    if (full.isValid) return { month: full.month, day: full.day };

    return null;
  }

  private mdCompare(a: { month: number; day: number }, b: { month: number; day: number }): number {
    return a.month !== b.month ? a.month - b.month : a.day - b.day;
  }

  /**
   * Determine if a job should be running right now.
   */
  shouldJobRun(job: Job, now: DateTime = DateTime.now()): boolean {
    if (!this.isWithinPeriod(now, job.periodStart, job.periodEnd, job.periodRecurrent)) {
      return false;
    }

    if (job.triggerType === 'continuous') {
      return this.isContinuousJobActive(job, now);
    }

    return this.cronMatchesNow(job.cron, now);
  }

  private isContinuousJobActive(job: Job, now: DateTime): boolean {
    if (!job.cronStop) return true;

    try {
      const jsNow = now.toJSDate();
      const lastStart = DateTime.fromJSDate(
        CronExpressionParser.parse(job.cron, { currentDate: jsNow }).prev().toDate(),
      );
      const lastStop = DateTime.fromJSDate(
        CronExpressionParser.parse(job.cronStop, { currentDate: jsNow }).prev().toDate(),
      );

      return lastStart > lastStop;
    } catch {
      this.logger.warn(`Invalid cron for job ${job.id}`);
      return false;
    }
  }

  /**
   * Get the next occurrence for a job.
   */
  getNextOccurrence(job: Job): DateTime | null {
    try {
      const next = CronExpressionParser.parse(job.cron).next().toDate();
      return DateTime.fromJSDate(next);
    } catch {
      return null;
    }
  }
}
