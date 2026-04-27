import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/prisma/prisma.service';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'video/mp4',
  'application/pdf',
]);

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export interface GetPresignedUrlInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  tenantId: string;
  uploadedById: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  fileKey: string;
  assetId: string;
}

@Injectable()
export class MediaService {
  private _s3: S3Client | null = null;
  private _bucket: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /** Lazy S3 client — only initialized when a media endpoint is actually called. */
  private getS3(): { client: S3Client; bucket: string } {
    if (!this._s3 || !this._bucket) {
      const accessKeyId = this.configService.get<string>('aws.accessKeyId');
      const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');
      const bucket = this.configService.get<string>('aws.s3Bucket');

      if (!accessKeyId || !secretAccessKey || !bucket) {
        throw new ServiceUnavailableException(
          'S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in your .env.',
        );
      }

      this._s3 = new S3Client({
        region: this.configService.get<string>('aws.region') ?? 'us-east-1',
        credentials: { accessKeyId, secretAccessKey },
      });
      this._bucket = bucket;
    }
    return { client: this._s3, bucket: this._bucket };
  }

  async getPresignedUrl(input: GetPresignedUrlInput): Promise<PresignedUrlResult> {
    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new BadRequestException(
        `MIME type '${input.mimeType}' is not allowed`,
      );
    }

    if (input.sizeBytes > MAX_SIZE_BYTES) {
      throw new BadRequestException('File exceeds maximum size of 50MB');
    }

    const { client, bucket } = this.getS3();

    // Build a safe S3 key — never trust the original fileName for path building
    const ext = input.mimeType.split('/')[1] ?? 'bin';
    const fileKey = `${input.tenantId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: input.mimeType,
      ContentLength: input.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 }); // 5 min

    // Create unconfirmed media asset record
    const asset = await this.prisma.mediaAsset.create({
      data: {
        tenantId: input.tenantId,
        uploadedById: input.uploadedById,
        fileKey,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        confirmed: false,
      },
    });

    return { uploadUrl, fileKey, assetId: asset.id };
  }

  async confirmUpload(assetId: string, tenantId: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, tenantId, confirmed: false },
    });

    if (!asset) throw new BadRequestException('Media asset not found or already confirmed');

    await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: { confirmed: true },
    });
  }

  async deleteAsset(assetId: string, tenantId: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, tenantId },
    });

    if (!asset) throw new BadRequestException('Media asset not found');

    // Delete from S3
    const { client, bucket } = this.getS3();
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: asset.fileKey }),
    );

    // Delete from DB
    await this.prisma.mediaAsset.delete({ where: { id: assetId } });
  }
}
