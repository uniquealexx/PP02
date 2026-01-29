import { Injectable } from '@nestjs/common';
import type { AuthUserDto } from '@servicedesk/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(): Promise<AuthUserDto[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }

  async getUserById(userId: string): Promise<AuthUserDto | undefined> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return undefined;
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
