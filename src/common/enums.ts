export enum ActionType {
  RECORD = 'record',
  SNAPSHOT = 'snapshot',
  TIMELAPSE = 'timelapse',
  DETECT_MOTION = 'detect_motion',
  TEST_CONNECTION = 'test_connection',
  CUSTOM_COMMAND = 'custom_command',
}

export enum TriggerType {
  CONTINUOUS = 'continuous',
  ONESHOT = 'oneshot',
  FIXED_DURATION = 'fixed_duration',
}

export enum JobStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
  COMPLETED = 'completed',
  KILLED = 'killed',
}

export enum Protocol {
  RTSP = 'rtsp',
  RTMP = 'rtmp',
  HTTP = 'http',
  ONVIF = 'onvif',
}
