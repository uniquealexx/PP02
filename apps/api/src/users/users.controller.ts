import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AuthUserDto } from '@servicedesk/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ description: 'List users.' })
  async getUsers(): Promise<AuthUserDto[]> {
    return this.usersService.getUsers();
  }
}
