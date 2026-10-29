/// <reference types="node" />
import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.warn('🌱 Starting COOPECA demonstration seed...\n');

  // 1. Create Zone
  const zone = await prisma.zone.upsert({
    where: { code: 'ZONE-COOPEC' },
    update: {},
    create: {
      code: 'ZONE-COOPEC',
      name: 'Zone COOPECA Paris',
    },
  });
  console.warn(`✅ Zone: ${zone.name}`);

  // 2. Create Markets
  const market1 = await prisma.market.upsert({
    where: { code: 'MKT-PARIS-01' },
    update: {},
    create: { code: 'MKT-PARIS-01', name: 'Marché Paris Centre', zoneId: zone.id },
  });
  console.warn(`✅ Market: ${market1.name}`);

  const market2 = await prisma.market.upsert({
    where: { code: 'MKT-PARIS-02' },
    update: {},
    create: { code: 'MKT-PARIS-02', name: 'Marché Paris Nord', zoneId: zone.id },
  });
  console.warn(`✅ Market: ${market2.name}`);

  // 3. Create Branches
  const branch1 = await prisma.branch.upsert({
    where: { code: 'BR-PARIS-001' },
    update: {},
    create: {
      code: 'BR-PARIS-001',
      name: 'Agence Paris 1',
      address: '1 Rue de la Tontine',
      marketId: market1.id,
    },
  });
  console.warn(`✅ Branch: ${branch1.name}`);

  const branch2 = await prisma.branch.upsert({
    where: { code: 'BR-PARIS-002' },
    update: {},
    create: {
      code: 'BR-PARIS-002',
      name: 'Agence Paris 2',
      address: '2 Avenue des Versements',
      marketId: market2.id,
    },
  });
  console.warn(`✅ Branch: ${branch2.name}`);

  // 4. Create Users
  const adminUser = await prisma.appUser.upsert({
    where: { username: 'admin.coopeca' },
    update: {},
    create: {
      username: 'admin.coopeca',
      passwordHash: '$2b$10$dummy',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.warn(`✅ Admin: ${adminUser.username}`);

  const supervisor1 = await prisma.appUser.upsert({
    where: { username: 'superv.paris1' },
    update: {},
    create: {
      username: 'superv.paris1',
      passwordHash: '$2b$10$dummy',
      role: 'SUPERVISOR',
      isActive: true,
    },
  });
  console.warn(`✅ Supervisor: ${supervisor1.username}`);

  const agent1 = await prisma.appUser.upsert({
    where: { username: 'agent.paris1' },
    update: {},
    create: {
      username: 'agent.paris1',
      passwordHash: '$2b$10$dummy',
      role: 'AGENT',
      isActive: true,
    },
  });
  console.warn(`✅ Agent: ${agent1.username}`);

  // 5. Create Clients
  const client1 = await prisma.client.upsert({
    where: { code: 'CLT-PARIS1-001' },
    update: {},
    create: {
      code: 'CLT-PARIS1-001',
      name: 'M. Dupont',
      phone: '+33 6 12 34 56 78',
      email: 'dupont@example.com',
      status: 'PROVISIONAL',
      collectionAgentId: agent1.id,
      branchId: branch1.id,
    },
  });
  console.warn(`✅ Client: ${client1.name} (${client1.status})`);

  const client2 = await prisma.client.upsert({
    where: { code: 'CLT-PARIS1-002' },
    update: {},
    create: {
      code: 'CLT-PARIS1-002',
      name: 'Mme Martin',
      phone: '+33 6 23 45 67 89',
      email: 'martin@example.com',
      status: 'ACTIVE',
      collectionAgentId: agent1.id,
      branchId: branch1.id,
    },
  });
  console.warn(`✅ Client: ${client2.name} (${client2.status})`);

  console.warn('\n🌱 Seed completed!\n');
// 5. Create a dossier (required for TontineCycle.dossierId)
   const dossier1 = await prisma.dossier.create({
     data: {
       clientId: client1.id,
       agentId: agent1.id,
       dailyAmountXaf: 5000,
       localReference: 'LOCAL-001',
       dossierNo: 'DOSSIER-001',
       clientOperationId: randomUUID(),
       deviceId: 'seed-device-001',
       openedAtDeclared: new Date(),
       openingBusinessDate: new Date(),
       status: 'OPEN',
       version: 1,
     },
   });
   console.warn(`✅ Dossier: ${dossier1.dossierNo}`);

   // 6. Create tontine cycle (all required fields)
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
       clientOperationId: randomUUID(),
       payloadHash: randomUUID().replace(/-/g, '').substring(0, 64),
       version: 1,
     },
   });
   console.warn(`✅ Cycle: ${cycle1.id} (31 versements de ${cycle1.fixedAmountXaf} FCFA)`);

   // 7. Create cycle event
   await prisma.tontineCycleEvent.create({
     data: {
       cycleId: cycle1.id,
       actorUserId: agent1.id,
       eventType: 'OPENED',
       requestId: randomUUID(),
     },
   });
   console.warn(`✅ Cycle event: OPENED`);

   // 8. Create initial deposit cycle transaction
   await prisma.cycleTransaction.create({
     data: {
       cycleId: cycle1.id,
       type: 'DEPOSIT',
       amountXaf: 5000n,
       actorUserId: agent1.id,
       idempotencyKey: randomUUID(),
       payloadHash: randomUUID().replace(/-/g, '').substring(0, 64),
     },
   });
   console.warn(`✅ Cycle transaction: DEPOSIT 5000 FCFA`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });