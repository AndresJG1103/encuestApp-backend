/**
 * Prisma seed — puebla todas las tablas con datos de demo.
 * Run: pnpm db:seed
 *
 * Tenant slug: demo-corp
 * Admin:       admin@demo.com        / Admin1234!
 * Creator:     creator@demo.com      / Creator1234!
 * Respondent:  respondent@demo.com   / Respondent1234!
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  RoleType,
  TenantPlan,
  FormType,
  FormStatus,
  ItemType,
  AssignmentStatus,
  SessionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── TENANT ──────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name: 'Demo Corporation',
      slug: 'demo-corp',
      plan: TenantPlan.PRO,
      settings: { allowSelfRegister: false },
    },
  });
  console.log(`✔ Tenant:     ${tenant.name}`);

  // ── USERS ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@demo.com', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash('Admin1234!', 12),
      firstName: 'Admin',
      lastName: 'Demo',
      identityDocument: '10000001A',
      roles: { create: { tenantId: tenant.id, role: RoleType.TENANT_ADMIN } },
    },
  });

  const creator = await prisma.user.upsert({
    where: { email_tenantId: { email: 'creator@demo.com', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'creator@demo.com',
      passwordHash: await bcrypt.hash('Creator1234!', 12),
      firstName: 'Creator',
      lastName: 'Demo',
      identityDocument: '20000002B',
      roles: { create: { tenantId: tenant.id, role: RoleType.CREATOR } },
    },
  });

  const respondent = await prisma.user.upsert({
    where: { email_tenantId: { email: 'respondent@demo.com', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'respondent@demo.com',
      passwordHash: await bcrypt.hash('Respondent1234!', 12),
      firstName: 'Respondent',
      lastName: 'Demo',
      identityDocument: '30000003C',
      roles: { create: { tenantId: tenant.id, role: RoleType.RESPONDENT } },
    },
  });
  console.log(`✔ Users:      ${admin.email}, ${creator.email}, ${respondent.email}`);

  // ── FORM (SURVEY) ─────────────────────────────────────────────────────────
  const surveyForm = await prisma.form.upsert({
    where: { id: 'seed-form-survey-001' },
    update: {},
    create: {
      id: 'seed-form-survey-001',
      tenantId: tenant.id,
      createdById: creator.id,
      title: 'Encuesta de Satisfacción Demo',
      description: 'Formulario de demo tipo SURVEY con preguntas de ejemplo.',
      type: FormType.SURVEY,
      status: FormStatus.PUBLISHED,
      config: {
        sequential: false,
        allowSkip: true,
        passingScore: null,
        maxAttempts: null,
        timeLimit: null,
        shuffleQuestions: false,
        showResultsAfter: true,
        certificateOnPass: false,
      },
    },
  });

  // ── FORM (TRAINING) ───────────────────────────────────────────────────────
  const trainingForm = await prisma.form.upsert({
    where: { id: 'seed-form-training-001' },
    update: {},
    create: {
      id: 'seed-form-training-001',
      tenantId: tenant.id,
      createdById: creator.id,
      title: 'Capacitación en Seguridad Demo',
      description: 'Formulario de demo tipo TRAINING con evaluación y certificado.',
      type: FormType.TRAINING,
      status: FormStatus.PUBLISHED,
      config: {
        sequential: true,
        allowSkip: false,
        passingScore: 70,
        maxAttempts: 3,
        timeLimit: 1800,
        shuffleQuestions: true,
        showResultsAfter: true,
        certificateOnPass: true,
      },
    },
  });
  console.log(`✔ Forms:      "${surveyForm.title}", "${trainingForm.title}"`);

  // ── SECTIONS ──────────────────────────────────────────────────────────────
  const section1 = await prisma.section.upsert({
    where: { id: 'seed-section-001' },
    update: {},
    create: {
      id: 'seed-section-001',
      formId: surveyForm.id,
      title: 'Datos Generales',
      order: 0,
      branchingRules: [],
    },
  });

  const section2 = await prisma.section.upsert({
    where: { id: 'seed-section-002' },
    update: {},
    create: {
      id: 'seed-section-002',
      formId: surveyForm.id,
      title: 'Preguntas de Satisfacción',
      order: 1,
      branchingRules: [],
    },
  });

  const section3 = await prisma.section.upsert({
    where: { id: 'seed-section-003' },
    update: {},
    create: {
      id: 'seed-section-003',
      formId: trainingForm.id,
      title: 'Módulo de Seguridad',
      order: 0,
      branchingRules: [],
    },
  });
  console.log(`✔ Sections:   ${section1.title}, ${section2.title}, ${section3.title}`);

  // ── ITEMS ─────────────────────────────────────────────────────────────────
  const item1 = await prisma.item.upsert({
    where: { id: 'seed-item-001' },
    update: {},
    create: {
      id: 'seed-item-001',
      sectionId: section1.id,
      type: ItemType.TEXT,
      order: 0,
      content: {
        text: 'Bienvenido a la encuesta de satisfacción. Sus respuestas son anónimas.',
      },
    },
  });

  const item2 = await prisma.item.upsert({
    where: { id: 'seed-item-002' },
    update: {},
    create: {
      id: 'seed-item-002',
      sectionId: section2.id,
      type: ItemType.QUESTION,
      order: 0,
      content: {
        questionType: 'SINGLE_CHOICE',
        text: '¿Qué tan satisfecho está con el servicio?',
        options: ['Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho'],
        correctAnswers: [],
        points: 0,
        required: true,
      },
    },
  });

  const item3 = await prisma.item.upsert({
    where: { id: 'seed-item-003' },
    update: {},
    create: {
      id: 'seed-item-003',
      sectionId: section2.id,
      type: ItemType.QUESTION,
      order: 1,
      content: {
        questionType: 'OPEN_TEXT',
        text: '¿Tiene algún comentario adicional?',
        correctAnswers: [],
        points: 0,
        required: false,
      },
    },
  });

  const item4 = await prisma.item.upsert({
    where: { id: 'seed-item-004' },
    update: {},
    create: {
      id: 'seed-item-004',
      sectionId: section3.id,
      type: ItemType.QUESTION,
      order: 0,
      content: {
        questionType: 'SINGLE_CHOICE',
        text: '¿Cuál es el equipo de protección obligatorio en planta?',
        options: ['Solo casco', 'Casco y guantes', 'Casco, guantes y lentes', 'Ninguno'],
        correctAnswers: ['Casco, guantes y lentes'],
        points: 10,
        required: true,
      },
    },
  });

  const item5 = await prisma.item.upsert({
    where: { id: 'seed-item-005' },
    update: {},
    create: {
      id: 'seed-item-005',
      sectionId: section3.id,
      type: ItemType.QUESTION,
      order: 1,
      content: {
        questionType: 'BOOLEAN',
        text: '¿Está prohibido usar el celular en áreas de maquinaria?',
        correctAnswers: ['true'],
        points: 10,
        required: true,
      },
    },
  });
  console.log(`✔ Items:      ${item1.id}, ${item2.id}, ${item3.id}, ${item4.id}, ${item5.id}`);

  // ── ASSIGNMENT ────────────────────────────────────────────────────────────
  const assignment = await prisma.assignment.upsert({
    where: { formId_userId: { formId: trainingForm.id, userId: respondent.id } },
    update: {},
    create: {
      formId: trainingForm.id,
      userId: respondent.id,
      assignedById: admin.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      status: AssignmentStatus.PENDING,
    },
  });
  console.log(`✔ Assignment: form "${trainingForm.title}" → ${respondent.email}`);

  // ── RESPONSE SESSION (completada) ─────────────────────────────────────────
  const session = await prisma.responseSession.upsert({
    where: { id: 'seed-session-001' },
    update: {},
    create: {
      id: 'seed-session-001',
      formId: surveyForm.id,
      userId: respondent.id,
      attempt: 1,
      status: SessionStatus.COMPLETED,
      score: null,
      passed: null,
      progressSnapshot: { currentSectionIndex: 1, answeredItemIds: [item2.id, item3.id] },
      startedAt: new Date(Date.now() - 10 * 60 * 1000),
      completedAt: new Date(),
    },
  });

  // ── ITEM RESPONSES ─────────────────────────────────────────────────────────
  await prisma.itemResponse.upsert({
    where: { sessionId_itemId: { sessionId: session.id, itemId: item2.id } },
    update: {},
    create: {
      sessionId: session.id,
      itemId: item2.id,
      answer: { selected: ['Satisfecho'] },
      isCorrect: null,
      timeSpentMs: 5000,
    },
  });

  await prisma.itemResponse.upsert({
    where: { sessionId_itemId: { sessionId: session.id, itemId: item3.id } },
    update: {},
    create: {
      sessionId: session.id,
      itemId: item3.id,
      answer: { text: 'Muy buen servicio, lo recomendaría.' },
      isCorrect: null,
      timeSpentMs: 12000,
    },
  });
  console.log(`✔ Session:    completed survey (respondent)`);

  // ── MEDIA ASSET ───────────────────────────────────────────────────────────
  await prisma.mediaAsset.upsert({
    where: { fileKey: 'tenants/demo-corp/media/seed-image-001.png' },
    update: {},
    create: {
      tenantId: tenant.id,
      uploadedById: creator.id,
      fileKey: 'tenants/demo-corp/media/seed-image-001.png',
      mimeType: 'image/png',
      sizeBytes: 204800,
      confirmed: true,
    },
  });
  console.log(`✔ MediaAsset: seed-image-001.png`);

  // ── CERTIFICATE ────────────────────────────────────────────────────────────
  // Necesita una sesión de training completada con passed=true
  const trainingSession = await prisma.responseSession.upsert({
    where: { id: 'seed-session-002' },
    update: {},
    create: {
      id: 'seed-session-002',
      formId: trainingForm.id,
      userId: respondent.id,
      attempt: 1,
      status: SessionStatus.COMPLETED,
      score: 100,
      passed: true,
      progressSnapshot: {},
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      completedAt: new Date(),
    },
  });

  await prisma.certificate.upsert({
    where: { sessionId: trainingSession.id },
    update: {},
    create: {
      sessionId: trainingSession.id,
      userId: respondent.id,
      formId: trainingForm.id,
      pdfUrl: 'https://placeholder-s3-bucket.s3.amazonaws.com/certificates/seed-cert-001.pdf',
      verificationCode: 'DEMO-CERT-2026-001',
    },
  });
  console.log(`✔ Certificate: DEMO-CERT-2026-001 (respondent, training)`);

  console.log('\n✅ Seed completo — todas las tablas pobladas');
  console.log('────────────────────────────────────────────');
  console.log('Tenant:      demo-corp');
  console.log('Admin:       admin@demo.com        / Admin1234!');
  console.log('Creator:     creator@demo.com      / Creator1234!');
  console.log('Respondent:  respondent@demo.com   / Respondent1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

