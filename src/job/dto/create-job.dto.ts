import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { ActionType, TriggerType } from '../../common/enums.js';

export class CreateJobDto {
  @IsString()
  name!: string;

  @IsString()
  cameraId!: string;

  @IsString()
  @IsOptional()
  streamKey?: string = 'main';

  @IsEnum(ActionType)
  action!: ActionType;

  @IsEnum(TriggerType)
  @IsOptional()
  triggerType?: TriggerType = TriggerType.CONTINUOUS;

  @IsString()
  cron!: string;

  @IsString()
  @IsOptional()
  cronStop?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  duration?: number;

  @IsString()
  @IsOptional()
  periodStart?: string;

  @IsString()
  @IsOptional()
  periodEnd?: string;

  @IsBoolean()
  @IsOptional()
  periodRecurrent?: boolean = false;

  @IsString()
  outputDir!: string;

  @IsString()
  @IsOptional()
  filePattern?: string = '{cameraName}_{timestamp}';

  @IsString()
  @IsOptional()
  outputFormat?: string = 'mp4';

  @IsInt()
  @IsOptional()
  segmentDuration?: number;

  @IsString()
  @IsOptional()
  codec?: string = 'copy';

  @IsString()
  @IsOptional()
  resolution?: string;

  @IsInt()
  @IsOptional()
  quality?: number;

  @IsOptional()
  extraArgs?: string[];

  @IsString()
  @IsOptional()
  customCommand?: string;

  @IsInt()
  @IsOptional()
  commandTimeout?: number;

  @IsInt()
  @IsOptional()
  retentionDays?: number;

  @IsNumber()
  @IsOptional()
  retentionMaxGB?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  maxRetries?: number = 3;

  @IsInt()
  @IsOptional()
  priority?: number = 0;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;
}
