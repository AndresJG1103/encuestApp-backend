export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  roles: string[];
  jti: string;       // unique token id — used for blacklisting
  iat?: number;
  exp?: number;
}
