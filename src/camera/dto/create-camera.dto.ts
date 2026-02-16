import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Protocol } from '../../common/enums.js';

export class CreateCameraDto {
  @IsString()
  name!: string;

  @IsEnum(Protocol)
  @IsOptional()
  protocol?: Protocol = Protocol.RTSP;

  @IsObject()
  streams!: Record<string, string>; // { main: "rtsp://...", sub: "rtsp://..." }

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;
}
