import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthResponseDto, AuthUserDto, LoginDto, RegisterDto } from '@servicedesk/shared';
import bcrypt from 'bcryptjs';
import type { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const toAuthUser = (user: PrismaUser): AuthUserDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async signToken(user: PrismaUser): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }

  async register(payload: RegisterDto): Promise<{ response: AuthResponseDto; token: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('Email already registered.');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: payload.name.trim(),
        email: payload.email.toLowerCase(),
        passwordHash,
        role: 'USER',
      },
    });

    const token = await this.signToken(user);
    return { response: { user: toAuthUser(user) }, token };
  }

  async login(payload: LoginDto): Promise<{ response: AuthResponseDto; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const token = await this.signToken(user);

    return { response: { user: toAuthUser(user) }, token };
  }

  async getUserById(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return toAuthUser(user);
  }
}
