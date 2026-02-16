import type { ChildProcess } from 'node:child_process';

export interface ProcessEntry {
  jobId: string;
  process: ChildProcess;
  startedAt: Date;
  retries: number;
  executionId: string;
}

export interface ProcessStatus {
  jobId: string;
  running: boolean;
  pid: number | null;
  startedAt: Date | null;
  uptime: number | null;
  retries: number;
  lastError: string | null;
}

export interface LogBuffer {
  jobId: string;
  lines: string[];
  maxLines: number;
}

export interface SchedulerTickResult {
  started: string[];
  stopped: string[];
  errors: string[];
}
