import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'file:./dev.db';
    }
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
