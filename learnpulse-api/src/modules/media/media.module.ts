import { Module } from '@nestjs/common';
import { MediaService } from './application/media.service';
import { MediaController } from './presentation/media.controller';

@Module({
  providers: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}
