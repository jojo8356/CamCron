import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:logs')
  handleSubscribeLogs(
    @MessageBody() jobId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `logs:${jobId}`;
    void client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe:logs')
  handleUnsubscribeLogs(
    @MessageBody() jobId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `logs:${jobId}`;
    void client.leave(room);
    this.logger.debug(`Client ${client.id} left room ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  @OnEvent('job:started')
  onJobStarted(payload: { jobId: string; jobName: string; pid: number }) {
    this.server.emit('job:started', payload);
    this.server.emit('status:update', { type: 'job:started', ...payload });
  }

  @OnEvent('job:stopped')
  onJobStopped(payload: {
    jobId: string;
    jobName: string;
    status: string;
    code: number | null;
    signal: string | null;
  }) {
    this.server.emit('job:stopped', payload);
    this.server.emit('status:update', { type: 'job:stopped', ...payload });
  }

  @OnEvent('job:retry')
  onJobRetry(payload: {
    jobId: string;
    jobName: string;
    retry: number;
    maxRetries: number;
  }) {
    this.server.emit('job:retry', payload);
  }

  @OnEvent('job:log')
  onJobLog(payload: { jobId: string; line: string }) {
    this.server.to(`logs:${payload.jobId}`).emit('job:log', payload);
  }
}
