import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const databaseUrl = 'file:./dev.db';

  beforeAll(async () => {
    execSync('bunx prisma migrate dev --name init --skip-seed', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
  });

  beforeEach(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET = 'test-secret';

    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.user.deleteMany();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('registers a user and enforces unique email', async () => {
    const payload = {
      name: 'Test User',
      email: 'user@test.local',
      password: 'User123!',
    };

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(400);
  });

  it('logs in and sets cookie', async () => {
    const payload = {
      name: 'Login User',
      email: 'login@test.local',
      password: 'User123!',
    };

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    const setCookie = response.header['set-cookie'];
    expect(setCookie?.some((cookie) => cookie.includes('sd_token='))).toBe(true);
  });

  it('/me without token returns 401', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('/tickets without token returns 401', () => {
    return request(app.getHttpServer()).get('/api/tickets').expect(401);
  });
});
