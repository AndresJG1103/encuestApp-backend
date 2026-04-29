/**
 * Prisma seed — creates a default tenant and TENANT_ADMIN user for development.
 * Run: pnpm db:seed
 *
 * Credentials after seeding:
 *   Tenant slug: demo-corp
 *   Email:       admin@demo.com
 *   Password:    Admin1234!
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { RoleType, TenantPlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name: 'Demo Corporation',
      slug: 'demo-corp',
      plan: TenantPlan.PRO,
      settings: {},
    },
  });

  console.log(`Tenant: ${tenant.name} (${tenant.slug})`);

  const passwordHash = await bcrypt.hash('Admin1234!', 12);

  // Create TENANT_ADMIN
  const admin = await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@demo.com', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Demo',
      roles: {
        create: { tenantId: tenant.id, role: RoleType.TENANT_ADMIN },
      },
    },
  });

  console.log(`Admin user: ${admin.email}`);

  // Create a CREATOR user
  const creator = await prisma.user.upsert({
    where: { email_tenantId: { email: 'creator@demo.com', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'creator@demo.com',
      passwordHash: await bcrypt.hash('Creator1234!', 12),
      firstName: 'Creator',
      lastName: 'Demo',
      roles: {
        create: { tenantId: tenant.id, role: RoleType.CREATOR },
      },
    },
  });

  console.log(`Creator user: ${creator.email}`);

  // Create a RESPONDENT user
  const respondent = await prisma.user.upsert({
    where: { email_tenantId: { email: 'respondent@demo.com', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'respondent@demo.com',
      passwordHash: await bcrypt.hash('Respondent1234!', 12),
      firstName: 'Respondent',
      lastName: 'Demo',
      roles: {
        create: { tenantId: tenant.id, role: RoleType.RESPONDENT },
      },
    },
  });

  console.log(`Respondent user: ${respondent.email}`);

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────');
  console.log('Tenant slug: demo-corp');
  console.log('Admin:       admin@demo.com       / Admin1234!');
  console.log('Creator:     creator@demo.com     / Creator1234!');
  console.log('Respondent:  respondent@demo.com  / Respondent1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
