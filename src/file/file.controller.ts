import {
  Controller,
  Get,
  Delete,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileService } from './file.service.js';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  async list(@Query('path') path: string = '') {
    return this.fileService.list(path);
  }

  @Get('download')
  download(
    @Query('path') path: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const { stream, filename } = this.fileService.getDownloadStream(path);
    res.set({
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    return new StreamableFile(stream);
  }

  @Delete()
  async remove(@Query('path') path: string) {
    await this.fileService.remove(path);
    return { message: 'Supprimé' };
  }
}
