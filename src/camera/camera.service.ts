import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCameraDto } from './dto/create-camera.dto.js';
import { UpdateCameraDto } from './dto/update-camera.dto.js';

@Injectable()
export class CameraService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCameraDto) {
    return this.prisma.camera.create({
      data: {
        name: dto.name,
        protocol: dto.protocol ?? 'rtsp',
        streams: JSON.stringify(dto.streams),
        username: dto.username,
        password: dto.password,
        tags: dto.tags ? JSON.stringify(dto.tags) : null,
        location: dto.location,
        model: dto.model,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async findAll() {
    const cameras = await this.prisma.camera.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return cameras.map((c) => this.deserialize(c));
  }

  async findOne(id: string) {
    const camera = await this.prisma.camera.findUnique({ where: { id } });
    if (!camera) throw new NotFoundException(`Camera ${id} not found`);
    return this.deserialize(camera);
  }

  async update(id: string, dto: UpdateCameraDto) {
    await this.findOne(id);
    return this.prisma.camera.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.protocol !== undefined && { protocol: dto.protocol }),
        ...(dto.streams !== undefined && {
          streams: JSON.stringify(dto.streams),
        }),
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.password !== undefined && { password: dto.password }),
        ...(dto.tags !== undefined && { tags: JSON.stringify(dto.tags) }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.camera.delete({ where: { id } });
  }

  private deserialize(camera: Record<string, unknown>) {
    return {
      ...camera,
      streams:
        typeof camera.streams === 'string'
          ? JSON.parse(camera.streams as string)
          : camera.streams,
      tags:
        typeof camera.tags === 'string'
          ? JSON.parse(camera.tags as string)
          : camera.tags,
    };
  }
}
