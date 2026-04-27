import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { CertificateService } from './application/certificate.service';
import { CertificateController } from './presentation/certificate.controller';
import { CertificateProcessor } from './infrastructure/certificate.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'certificate-queue' }),
  ],
  providers: [CertificateService, CertificateProcessor],
  controllers: [CertificateController],
})
export class CertificateModule {}
