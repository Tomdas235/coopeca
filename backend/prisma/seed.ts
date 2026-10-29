import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';

const prisma = new PrismaClient();

function uuid(): string {
  return randomUUID();
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  // Create zones (idempotent)
  const zone1 = await prisma.zone.upsert({
    where: { code: 'ZONE-ABC' },
    update: {},
    create: {
      code: 'ZONE-ABC',
      name: 'Zone Abidjan',
      isActive: true,
    },
  });

  // Create markets (idempotent)
  const market1 = await prisma.market.upsert({
    where: { code: 'MARKET-A1' },
    update: {},
    create: {
      code: 'MARKET-A1',
      name: 'Market Treichville',
      zoneId: zone1.id,
      isActive: true,
    },
  });

  // Create branches (idempotent; marketId is REQUIRED on Branch)
  const branch1 = await prisma.branch.upsert({
    where: { code: 'BR-A1' },
    update: {},
    create: {
      code: 'BR-A1',
      name: 'Agence Plateau',
      address: 'Plateau, Abidjan',
      phone: '+225 22 12 34 56',
      isActive: true,
      marketId: market1.id,
    },
  });

  // Create users (idempotent)
  const adminUser = await prisma.appUser.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hashPassword('admin123') },
    create: {
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      fullName: 'Administrateur Système',
      role: 'ADMIN',
      isActive: true,
      branchAccesses: {
        create: {
          isPrimary: true,
          branchId: branch1.id,
        },
      },
    },
  });

  const agent1 = await prisma.appUser.upsert({
    where: { username: 'agent1' },
    update: { passwordHash: hashPassword('agent123') },
    create: {
      username: 'agent1',
      passwordHash: hashPassword('agent123'),
      fullName: 'Jean Kouamé',
      role: 'AGENT',
      isActive: true,
      branchAccesses: {
        create: {
          isPrimary: true,
          branchId: branch1.id,
        },
      },
    },
  });

  const cashier1 = await prisma.appUser.upsert({
    where: { username: 'cashier1' },
    update: { passwordHash: hashPassword('cashier123') },
    create: {
      username: 'cashier1',
      passwordHash: hashPassword('cashier123'),
      fullName: 'Marie Koné',
      role: 'CASHIER',
      isActive: true,
      branchAccesses: {
        create: {
          isPrimary: true,
          branchId: branch1.id,
        },
      },
    },
  });

  const auditor1 = await prisma.appUser.upsert({
    where: { username: 'auditor1' },
    update: { passwordHash: hashPassword('auditor123') },
    create: {
      username: 'auditor1',
      passwordHash: hashPassword('auditor123'),
      fullName: 'Paul Traoré',
      role: 'AUDITOR',
      isActive: true,
      branchAccesses: {
        create: {
          isPrimary: true,
          branchId: branch1.id,
        },
      },
    },
  });

  const accountant1 = await prisma.appUser.upsert({
    where: { username: 'accountant1' },
    update: { passwordHash: hashPassword('accountant123') },
    create: {
      username: 'accountant1',
      passwordHash: hashPassword('accountant123'),
      fullName: 'Aïcha Bamba',
      role: 'ACCOUNTANT',
      isActive: true,
      branchAccesses: {
        create: {
          isPrimary: true,
          branchId: branch1.id,
        },
      },
    },
  });

  const supervisor1 = await prisma.appUser.upsert({
    where: { username: 'supervisor1' },
    update: { passwordHash: hashPassword('supervisor123') },
    create: {
      username: 'supervisor1',
      passwordHash: hashPassword('supervisor123'),
      fullName: 'Koffi Diallo',
      role: 'SUPERVISOR',
      isActive: true,
      branchAccesses: {
        create: {
          isPrimary: true,
          branchId: branch1.id,
        },
      },
    },
  });
  const client1 = await prisma.client.upsert({
    where: { clientCode: 'CLT-001' },
    update: {},
    create: {
      clientCode: 'CLT-001',
      firstName: 'Pierre',
      lastName: 'Ola',
      phone: '+225 01 23 45 67',
      status: 'ACTIVE',
      branchId: branch1.id,
      marketId: market1.id,
      collectionAgentId: agent1.id,
      createdBy: adminUser.id,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { clientCode: 'CLT-002' },
    update: {},
    create: {
      clientCode: 'CLT-002',
      firstName: 'Sophie',
      lastName: 'Diabaté',
      phone: '+225 01 23 45 68',
      status: 'ACTIVE',
      branchId: branch1.id,
      marketId: market1.id,
      collectionAgentId: agent1.id,
      createdBy: adminUser.id,
    },
  });

  // Create a dossier (required for TontineCycle.dossierId)
  const dossier1 = await prisma.dossier.create({
    data: {
      clientId: client1.id,
      agentId: agent1.id,
      dailyAmountXaf: 5000,
      localReference: 'LOCAL-001',
      dossierNo: 'DOSSIER-001',
      clientOperationId: uuid(),
      deviceId: 'seed-device-001',
      openedAtDeclared: new Date(),
      openingBusinessDate: new Date(),
      status: 'OPEN',
      version: 1,
    },
  });

  // Create tontine cycle (all required fields)
  const cycle1 = await prisma.tontineCycle.create({
    data: {
      dossierId: dossier1.id,
      clientId: client1.id,
      marketId: market1.id,
      branchId: branch1.id,
      openedByAgentId: agent1.id,
      fixedAmountXaf: 5000n,
      targetInstallments: 31,
      installmentCount: 0,
      totalCollectedXaf: 0n,
      status: 'ACTIVE',
      clientOperationId: uuid(),
      payloadHash: uuid().replace(/-/g, '').substring(0, 64),
      version: 1,
    },
  });

  // Create cycle event
  await prisma.tontineCycleEvent.create({
    data: {
      cycleId: cycle1.id,
      actorUserId: agent1.id,
      eventType: 'OPENED',
      requestId: uuid(),
    },
  });

  // Create a deposit cycle transaction
  await prisma.cycleTransaction.create({
    data: {
      cycleId: cycle1.id,
      type: 'DEPOSIT',
      amountXaf: 5000n,
      actorUserId: agent1.id,
      idempotencyKey: uuid(),
      payloadHash: uuid().replace(/-/g, '').substring(0, 64),
    },
  });

  console.warn('Seed data created successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error creating seed data:', e);
    await prisma.$disconnect();
    process.exit(1);
  });