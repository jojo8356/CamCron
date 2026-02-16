import { PartialType } from '@nestjs/mapped-types';
import { CreateCameraDto } from './create-camera.dto.js';

export class UpdateCameraDto extends PartialType(CreateCameraDto) {}
