import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { CommentsModule } from './comments/comments.module';
import { SlaModule } from './sla/sla.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DebugModule } from './debug/debug.module';

const enableDebugEndpoints =
  process.env.NODE_ENV !== 'production' || process.env.DEBUG_ENDPOINTS === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TicketsModule,
    AuditModule,
    NotificationsModule,
    UsersModule,
    CommentsModule,
    SlaModule,
    RealtimeModule,
    ...(enableDebugEndpoints ? [DebugModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
