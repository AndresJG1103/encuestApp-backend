import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '@shared/decorators/public.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { CertificateService } from '../application/certificate.service';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('my')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
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
  download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.certificateService.findById(id, user.sub);
  }

  @Get('verify/:code')
  @Public()
  verify(@Param('code') code: string) {
    return this.certificateService.verifyByCode(code);
  }
}
