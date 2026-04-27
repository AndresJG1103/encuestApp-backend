import { Module } from '@nestjs/common';
import { FormService } from './application/form.service';
import { FormController } from './presentation/form.controller';
import { FormPrismaRepository } from './infrastructure/form.prisma.repository';
import { FORM_REPOSITORY } from './domain/repositories/form.repository.interface';

@Module({
  providers: [
    FormService,
    { provide: FORM_REPOSITORY, useClass: FormPrismaRepository },
  ],
  controllers: [FormController],
  exports: [FormService],
})
export class FormModule {}
