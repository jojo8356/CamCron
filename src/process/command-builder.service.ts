import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { Job, Camera } from '../generated/prisma/client.js';
import { ActionType } from '../common/enums.js';

export interface CommandSpec {
  command: string;
  args: string[];
}

@Injectable()
export class CommandBuilderService {
  build(job: Job, camera: Camera, outputPath: string): CommandSpec {
    const streams: Record<string, string> =
      typeof camera.streams === 'string' ? JSON.parse(camera.streams) : {};
    const streamUrl = streams[job.streamKey] ?? streams['main'] ?? '';
    const extraArgs: string[] = job.extraArgs ? JSON.parse(job.extraArgs) : [];

    switch (job.action) {
      case ActionType.RECORD:
        return this.buildRecord(job, streamUrl, outputPath, extraArgs);
      case ActionType.SNAPSHOT:
        return this.buildSnapshot(job, streamUrl, outputPath, extraArgs);
      case ActionType.TIMELAPSE:
        return this.buildSnapshot(job, streamUrl, outputPath, extraArgs);
      case ActionType.TEST_CONNECTION:
        return this.buildTestConnection(streamUrl);
      case ActionType.DETECT_MOTION:
        return this.buildRecord(job, streamUrl, outputPath, extraArgs);
      case ActionType.CUSTOM_COMMAND:
        return this.buildCustomCommand(job, streamUrl);
      default:
        return this.buildRecord(job, streamUrl, outputPath, extraArgs);
    }
  }

  private buildRecord(
    job: Job,
    streamUrl: string,
    outputPath: string,
    extraArgs: string[],
  ): CommandSpec {
    const args: string[] = [
      '-hide_banner',
      '-loglevel', 'warning',
      ...extraArgs,
      '-i', streamUrl,
    ];

    if (job.codec === 'copy') {
      args.push('-c', 'copy');
    } else if (job.codec) {
      args.push('-c:v', job.codec);
    }

    if (job.resolution) {
      args.push('-s', job.resolution);
    }

    if (job.quality) {
      args.push('-q:v', String(job.quality));
    }

    if (job.segmentDuration) {
      args.push(
        '-f', 'segment',
        '-segment_time', String(job.segmentDuration),
        '-segment_format', job.outputFormat,
        '-reset_timestamps', '1',
        '-strftime', '1',
        `${outputPath}/%Y%m%d_%H%M%S.${job.outputFormat}`,
      );
    } else {
      args.push('-y', `${outputPath}/recording.${job.outputFormat}`);
    }

    return { command: 'ffmpeg', args };
  }

  private buildSnapshot(
    job: Job,
    streamUrl: string,
    outputPath: string,
    extraArgs: string[],
  ): CommandSpec {
    const format = job.outputFormat === 'mp4' ? 'jpg' : job.outputFormat;
    const args: string[] = [
      '-hide_banner',
      '-loglevel', 'warning',
      ...extraArgs,
      '-i', streamUrl,
      '-frames:v', '1',
    ];

    if (job.resolution) {
      args.push('-s', job.resolution);
    }

    if (job.quality && (format === 'jpg' || format === 'jpeg')) {
      args.push('-q:v', String(Math.max(1, Math.min(31, Math.round((100 - job.quality) * 31 / 100)))));
    }

    const timestamp = DateTime.now().toFormat('yyyyMMdd_HHmmss');
    args.push('-y', `${outputPath}/${timestamp}.${format}`);

    return { command: 'ffmpeg', args };
  }

  private buildTestConnection(streamUrl: string): CommandSpec {
    return {
      command: 'ffprobe',
      args: [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_streams',
        '-timeout', '10000000', // 10 seconds in microseconds
        streamUrl,
      ],
    };
  }

  private buildCustomCommand(job: Job, streamUrl: string): CommandSpec {
    if (!job.customCommand) {
      throw new Error(`Job ${job.id} has no custom command defined`);
    }

    const resolvedCmd = job.customCommand.replace(/\{streamUrl}/g, streamUrl);
    const parts = resolvedCmd.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    return { command, args };
  }
}
