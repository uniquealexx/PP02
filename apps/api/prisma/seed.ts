import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const SEED_USERS: SeedUser[] = [
  {
    name: 'Daria Admin',
    email: 'admin@local',
    password: 'Admin123!',
    role: 'ADMIN',
  },
  {
    name: 'Irina Volkova',
    email: 'agent1@local',
    password: 'Agent123!',
    role: 'AGENT',
  },
  {
    name: 'Denis Morozov',
    email: 'agent2@local',
    password: 'Agent123!',
    role: 'AGENT',
  },
  {
    name: 'Olga Petrova',
    email: 'user@local',
    password: 'User123!',
    role: 'USER',
  },
];

async function main() {
  for (const user of SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });
    if (existing) {
      continue;
    }
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
