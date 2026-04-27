import { Module } from '@nestjs/common';
import { AssignmentService } from './application/assignment.service';
import { AssignmentController } from './presentation/assignment.controller';

@Module({
  providers: [AssignmentService],
  controllers: [AssignmentController],
  exports: [AssignmentService],
})
export class AssignmentModule {}
