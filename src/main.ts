import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { execSync } from 'node:child_process';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate ffmpeg is available
  try {
    const version = execSync('ffmpeg -version', { encoding: 'utf-8' }).split('\n')[0];
    logger.log(`ffmpeg found: ${version}`);
  } catch {
    logger.error('ffmpeg not found in PATH. Please install ffmpeg.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();
  app.setGlobalPrefix('api');

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`CamCron running on http://localhost:${port}`);
}

bootstrap();
