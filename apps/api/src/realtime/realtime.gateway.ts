import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class RealtimeGateway {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server?: Server;

  emit(event: string, payload: unknown): void {
    if (!this.server) {
      this.logger.warn(`Realtime server not ready for ${event}`);
      return;
    }
    this.server.emit(event, payload);
  }
}
