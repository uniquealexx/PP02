import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AuthResponseDto } from '@servicedesk/shared';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AUTH_COOKIE_MAX_AGE_MS, AUTH_COOKIE_NAME } from './auth.constants';
import { LoginRequest } from './dto/login.request';
import { RegisterRequest } from './dto/register.request';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUserDto } from '@servicedesk/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterRequest })
  @ApiCreatedResponse({ description: 'Register user.' })
  async register(
    @Body() body: RegisterRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { response, token } = await this.authService.register(body);
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
      path: '/',
    });
    return response;
  }

  @Post('login')
  @HttpCode(200)
  @ApiBody({ type: LoginRequest })
  @ApiOkResponse({ description: 'Login user.' })
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { response, token } = await this.authService.login(body);
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
      path: '/',
    });
    return response;
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Logout user.' })
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, { sameSite: 'lax', path: '/' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Current user.' })
  me(@CurrentUser() user: AuthUserDto): AuthResponseDto {
    return { user };
  }
}
