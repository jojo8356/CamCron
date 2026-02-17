// Enums
export type ActionType = 'record' | 'snapshot' | 'timelapse' | 'detect_motion' | 'test_connection' | 'custom_command'
export type TriggerType = 'continuous' | 'oneshot' | 'fixed_duration'
export type JobStatus = 'running' | 'stopped' | 'error' | 'completed' | 'killed'
export type Protocol = 'rtsp' | 'rtmp' | 'http' | 'onvif'

// Models
export interface Camera {
  id: string
  name: string
  protocol: Protocol
  streams: Record<string, string>
  username: string | null
  password: string | null
  tags: string[]
  location: string | null
  model: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  name: string
  cameraId: string
  streamKey: string
  action: ActionType
  triggerType: TriggerType
  cron: string
  cronStop: string | null
  duration: number | null
  periodStart: string | null
  periodEnd: string | null
  periodRecurrent: boolean
  outputDir: string
  filePattern: string
  outputFormat: string
  segmentDuration: number | null
  codec: string | null
  resolution: string | null
  quality: number | null
  extraArgs: string[] | null
  customCommand: string | null
  commandTimeout: number | null
  retentionDays: number | null
  retentionMaxGB: number | null
  maxRetries: number
  priority: number
  enabled: boolean
  createdAt: string
  updatedAt: string
  camera?: Camera
}

export interface JobExecution {
  id: string
  jobId: string
  startedAt: string
  stoppedAt: string | null
  status: JobStatus
  exitCode: number | null
  error: string | null
  filesProduced: number
  bytesProduced: number
}

export interface ProcessStatus {
  jobId: string
  running: boolean
  pid: number | null
  startedAt: string | null
  uptime: number | null
  retries: number
  lastError: string | null
}

export interface JobWithRuntime extends Job {
  runtime: ProcessStatus
  nextOccurrence: string | null
}

// API responses
export interface HealthResponse {
  status: 'ok'
  uptime: number
  startedAt: string
}

export interface StatusResponse {
  cameras: number
  jobs: number
  activeProcesses: number
  runningJobs: ProcessStatus[]
  uptime: number
  ffmpegVersion: string | null
}

export interface TestConnectionResult {
  success: boolean
  error?: string
  streams?: unknown[]
}

// DTO types for creation/update
export interface CreateCameraDto {
  name: string
  protocol?: Protocol
  streams: Record<string, string>
  username?: string
  password?: string
  tags?: string[]
  location?: string
  model?: string
  enabled?: boolean
}

export type UpdateCameraDto = Partial<CreateCameraDto>

export interface CreateJobDto {
  name: string
  cameraId: string
  streamKey?: string
  action: ActionType
  triggerType?: TriggerType
  cron: string
  cronStop?: string
  duration?: number
  periodStart?: string
  periodEnd?: string
  periodRecurrent?: boolean
  outputDir: string
  filePattern?: string
  outputFormat?: string
  segmentDuration?: number
  codec?: string
  resolution?: string
  quality?: number
  extraArgs?: string[]
  customCommand?: string
  commandTimeout?: number
  retentionDays?: number
  retentionMaxGB?: number
  maxRetries?: number
  priority?: number
  enabled?: boolean
}

export type UpdateJobDto = Partial<CreateJobDto>

// File explorer
export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modifiedAt: string
}

// WebSocket events
export interface WsJobStarted {
  jobId: string
  jobName: string
  pid: number
}

export interface WsJobStopped {
  jobId: string
  jobName: string
  status: string
  code: number | null
  signal: string | null
}

export interface WsJobRetry {
  jobId: string
  jobName: string
  retry: number
  maxRetries: number
}

export interface WsJobLog {
  jobId: string
  line: string
}

export interface WsStatusUpdate {
  type: string
  jobId: string
  jobName: string
}
