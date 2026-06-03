export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  roles: string[];
  jti: string;       // unique token id — used for blacklisting
  firstName?: string;
  lastName?: string;
  email?: string;
  iat?: number;
  exp?: number;
}
