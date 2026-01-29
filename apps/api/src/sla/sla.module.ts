import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SlaController } from './sla.controller';
import { SlaService } from './sla.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuditModule, NotificationsModule, RealtimeModule, AuthModule],
  controllers: [SlaController],
  providers: [SlaService],
  exports: [SlaService],
})
export class SlaModule {}
