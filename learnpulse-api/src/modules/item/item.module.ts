import { Module } from '@nestjs/common';
import { ItemService } from './application/item.service';
import { ItemController } from './presentation/item.controller';

@Module({
  providers: [ItemService],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}
