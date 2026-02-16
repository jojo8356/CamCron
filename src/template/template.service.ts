import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

@Injectable()
export class TemplateService {
  resolve(pattern: string, variables: Record<string, string>): string {
    const now = DateTime.now();

    const builtIn: Record<string, string> = {
      date: now.toFormat('yyyy-MM-dd'),
      time: now.toFormat('HH-mm-ss'),
      timestamp: now.toFormat('yyyyMMdd_HHmmss'),
      year: now.toFormat('yyyy'),
      month: now.toFormat('MM'),
      day: now.toFormat('dd'),
      hour: now.toFormat('HH'),
      minute: now.toFormat('mm'),
    };

    const allVars = { ...builtIn, ...variables };

    return pattern.replace(/\{(\w+)}/g, (match, key: string) => {
      return allVars[key] ?? match;
    });
  }

  resolveForJob(
    pattern: string,
    context: {
      cameraId: string;
      cameraName: string;
      jobId: string;
      jobName: string;
    },
  ): string {
    return this.resolve(pattern, {
      cameraId: context.cameraId,
      cameraName: this.sanitizePath(context.cameraName),
      jobId: context.jobId,
      jobName: this.sanitizePath(context.jobName),
    });
  }

  async ensureDirectory(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
  }

  async ensureOutputDirectory(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
  }

  private sanitizePath(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').trim();
  }
}
