import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface CertificateJobData {
  sessionId: string;
  userId: string;
  formId: string;
  score: number | null;
}

/**
 * BullMQ Processor for certificate generation.
 * Uses @react-pdf/renderer or puppeteer to generate PDF and upload to S3.
 * The PDF generation library should be installed separately:
 *   pnpm add @react-pdf/renderer
 * or:
 *   pnpm add puppeteer
 */
@Processor('certificate-queue')
export class CertificateProcessor {
  private readonly logger = new Logger(CertificateProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('generate')
  async handleGenerate(job: Job<CertificateJobData>): Promise<void> {
    const { sessionId, userId, formId, score } = job.data;

    this.logger.log(
      `Generating certificate for session ${sessionId}, user ${userId}`,
    );

    try {
      // Check if certificate already exists (idempotent)
      const existing = await this.prisma.certificate.findUnique({
        where: { sessionId },
      });

      if (existing) {
        this.logger.log(`Certificate already exists for session ${sessionId}`);
        return;
      }

      // Fetch session, user, and form data for the certificate
      const [user, form] = await Promise.all([
        this.prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: { firstName: true, lastName: true, email: true },
        }),
        this.prisma.form.findUniqueOrThrow({
          where: { id: formId },
          select: { title: true },
        }),
      ]);

      const verificationCode = uuidv4();

      // TODO: Replace with real PDF generation + S3 upload
      // Example with puppeteer:
      //   const browser = await puppeteer.launch();
      //   const page = await browser.newPage();
      //   await page.setContent(buildCertificateHtml({ user, form, score, verificationCode }));
      //   const pdfBuffer = await page.pdf({ format: 'A4' });
      //   await browser.close();
      //   const fileKey = `certificates/${tenantId}/${verificationCode}.pdf`;
      //   await s3.send(new PutObjectCommand({ Bucket, Key: fileKey, Body: pdfBuffer, ContentType: 'application/pdf' }));
      //   const pdfUrl = `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;

      // Placeholder PDF URL until implementation
      const pdfUrl = `https://placeholder-s3-bucket.s3.amazonaws.com/certificates/${verificationCode}.pdf`;

      await this.prisma.certificate.create({
        data: {
          sessionId,
          userId,
          formId,
          pdfUrl,
          verificationCode,
        },
      });

      this.logger.log(
        `Certificate created: ${verificationCode} for ${user.firstName} ${user.lastName} — ${form.title} (score: ${score ?? 'N/A'})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate certificate for session ${sessionId}`,
        error,
      );
      throw error; // BullMQ will retry based on queue configuration
    }
  }
}
