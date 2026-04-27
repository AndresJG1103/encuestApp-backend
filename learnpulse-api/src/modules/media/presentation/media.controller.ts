import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { MediaService } from '../application/media.service';
import { ConfirmUploadDto, GetPresignedUrlDto } from '../application/dtos/media.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  getPresignedUrl(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: GetPresignedUrlDto,
  ) {
    return this.mediaService.getPresignedUrl({
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      tenantId,
      uploadedById: user.sub,
    });
  }

  @Post('confirm')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  confirmUpload(
    @CurrentTenant() tenantId: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.mediaService.confirmUpload(dto.assetId, tenantId);
  }

  @Delete(':id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.mediaService.deleteAsset(id, tenantId);
  }
}
