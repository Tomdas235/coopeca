import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create zones
  const zone1 = await prisma.zone.create({
    data: {
      code: 'ZONE-ABC',
      name: 'Zone Abidjan',
      isActive: true,
    },
  });

  const zone2 = await prisma.zone.create({
    data: {
      code: 'ZONE-XYZ',
      name: 'Zone Bouaké',
      isActive: true,
    },
  });

  // Create markets
  const market1 = await prisma.market.create({
    data: {
      code: 'MARKET-A1',
      name: 'Market Treichville',
      zoneId: zone1.id,
    },
  });

  const market2 = await prisma.market.create({
    data: {
      code: 'MARKET-B2',
      name: 'Market Koumassi',
      zoneId: zone1.id,
    },
  });

  // Create branches
  const branch1 = await prisma.branch.create({
    data: {
      code: 'BR-A1',
      name: 'Agence Plateau',
      address: 'Plateau, Abidjan',
      phone: '+225 22 12 34 56',
      isActive: true,
      marketId: market1.id,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      code: 'BR-B2',
      name: 'Agence Treichville',
      address: 'Treichville, Abidjan',
      phone: '+225 22 98 76 54',
      isActive: true,
      marketId: market1.id,
    },
  });

  // Create users (agents and admin)
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const agentPassword = await bcrypt.hash('agent123', saltRounds);

  const adminUser = await prisma.appUser.create({
    data: {
      username: 'admin',
      passwordHash: adminPassword,
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

  const agent1 = await prisma.appUser.create({
    data: {
      username: 'agent1',
      passwordHash: agentPassword,
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

  const agent2 = await prisma.appUser.create({
    data: {
      username: 'agent2',
      passwordHash: agentPassword,
      fullName: 'Marie Konan',
      role: 'AGENT',
      isActive: true,
      branchAccesses: {
        create: {
          isPrimary: true,
          branchId: branch2.id,
        },
      },
    },
  });

  // Create clients
  const client1 = await prisma.client.create({
    data: {
      fullName: 'Pierre Ola',
      username: 'pierre.ola',
      status: 'ACTIVE',
      branchId: branch1.id,
      cycle: {
        create: {
          collectionAgentId: agent1.id,
          fixedAmountXaf: 5000,
          targetDeposits: 31,
        },
      },
    },
  });

  const client2 = await prisma.client.create({
    data: {
      fullName: 'Sophie Diabaté',
      username: 'sophie.diabaté',
      status: 'ACTIVE',
      branchId: branch1.id,
    },
  });

  // Create tontine cycles
  const cycle1 = await prisma.tontineCycle.create({
    data: {
      clientId: client1.id,
      collectionAgentId: agent1.id,
      branchId: branch1.id,
      fixedAmountXaf: 5000,
      status: 'ACTIVE',
      currentDeposits: 0,
    },
  });

  // Create cycle events
  await prisma.tontineCycleEvent.create({
    data: {
      cycleId: cycle1.id,
      actorUserId: agent1.id,
      eventType: 'OPENED',
    },
  });

  // Create a completed deposit for demonstration
  await prisma.cycleTransaction.create({
    data: {
      cycleId: cycle1.id,
      type: 'DEPOSIT',
      amountXaf: 5000,
      status: 'RECORDED',
    },
  });

  console.log('Seed data created successfully');
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