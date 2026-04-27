import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { StartSessionUseCase } from './application/use-cases/start-session.use-case';
import { SubmitAnswerUseCase } from './application/use-cases/submit-answer.use-case';
import { CompleteSessionUseCase } from './application/use-cases/complete-session.use-case';
import { ResponseController } from './presentation/response.controller';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'certificate-queue' },
      { name: 'analytics-queue' },
    ),
  ],
  providers: [StartSessionUseCase, SubmitAnswerUseCase, CompleteSessionUseCase],
  controllers: [ResponseController],
})
export class ResponseModule {}
