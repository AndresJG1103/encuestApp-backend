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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { MediaService } from '../application/media.service';
import { ConfirmUploadDto, GetPresignedUrlDto } from '../application/dtos/media.dto';

@ApiTags('Media')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'Requires CREATOR role or higher' })
@ApiServiceUnavailableResponse({ description: 'S3 not configured â€” set AWS env vars' })
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get a presigned S3 PUT URL (5 min TTL) [CREATOR]' })
  @ApiOkResponse({ description: '{ uploadUrl, fileKey, assetId }' })
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
  @ApiOperation({ summary: 'Confirm that the S3 upload completed [CREATOR]' })
  @ApiNoContentResponse({ description: 'Asset marked as confirmed' })
  confirmUpload(
    @CurrentTenant() tenantId: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.mediaService.confirmUpload(dto.assetId, tenantId);
  }

  @Delete(':id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete media asset from S3 and DB [CREATOR]' })
  @ApiNoContentResponse({ description: 'Asset deleted' })
  @ApiNotFoundResponse({ description: 'Asset not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.mediaService.deleteAsset(id, tenantId);
  }
}

