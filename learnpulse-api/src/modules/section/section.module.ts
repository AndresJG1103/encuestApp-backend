import { Module } from '@nestjs/common';
import { SectionService } from './application/section.service';
import { SectionController } from './presentation/section.controller';

@Module({
  providers: [SectionService],
  controllers: [SectionController],
  exports: [SectionService],
})
export class SectionModule {}
