import { Global, Module } from '@nestjs/common';
import { TemplateService } from './template.service.js';

@Global()
@Module({
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
