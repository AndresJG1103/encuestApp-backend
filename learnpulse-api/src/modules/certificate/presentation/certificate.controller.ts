import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '@shared/decorators/public.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { CertificateService } from '../application/certificate.service';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('my')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List my certificates (paginated)' })
  @ApiOkResponse({ description: 'Paginated list of certificates' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.certificateService.findMine(user.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id/download')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get certificate details + PDF URL by ID' })
  @ApiOkResponse({ description: 'Certificate object with pdfUrl' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Certificate belongs to another user' })
  @ApiNotFoundResponse({ description: 'Certificate not found' })
  download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.certificateService.findById(id, user.sub);
  }

  @Get('verify/:code')
  @Public()
  @ApiOperation({ summary: 'Verify certificate authenticity by code (public)' })
  @ApiOkResponse({ description: 'Certificate details if valid' })
  @ApiNotFoundResponse({ description: 'No certificate found for that code' })
  verify(@Param('code') code: string) {
    return this.certificateService.verifyByCode(code);
  }
}

