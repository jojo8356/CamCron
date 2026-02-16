import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway.js';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockServer: {
    emit: jest.Mock;
    to: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsGateway],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);

    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };
    (gateway as any).server = mockServer;
  });

  describe('connection', () => {
    it('should handle client connection', () => {
      const client = { id: 'client-1' } as any;
      expect(() => gateway.handleConnection(client)).not.toThrow();
    });

    it('should handle client disconnection', () => {
      const client = { id: 'client-1' } as any;
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('subscribe:logs', () => {
    it('should join a log room', () => {
      const client = { id: 'client-1', join: jest.fn() } as any;
      const result = gateway.handleSubscribeLogs('job-1', client);
      expect(client.join).toHaveBeenCalledWith('logs:job-1');
      expect(result).toEqual({ event: 'subscribed', data: { room: 'logs:job-1' } });
    });
  });

  describe('unsubscribe:logs', () => {
    it('should leave a log room', () => {
      const client = { id: 'client-1', leave: jest.fn() } as any;
      const result = gateway.handleUnsubscribeLogs('job-1', client);
      expect(client.leave).toHaveBeenCalledWith('logs:job-1');
      expect(result).toEqual({ event: 'unsubscribed', data: { room: 'logs:job-1' } });
    });
  });

  describe('event forwarding', () => {
    it('should broadcast job:started', () => {
      const payload = { jobId: 'job-1', jobName: 'Test', pid: 1234 };
      gateway.onJobStarted(payload);
      expect(mockServer.emit).toHaveBeenCalledWith('job:started', payload);
      expect(mockServer.emit).toHaveBeenCalledWith('status:update', { type: 'job:started', ...payload });
    });

    it('should broadcast job:stopped', () => {
      const payload = { jobId: 'job-1', jobName: 'Test', status: 'completed', code: 0, signal: null };
      gateway.onJobStopped(payload);
      expect(mockServer.emit).toHaveBeenCalledWith('job:stopped', payload);
      expect(mockServer.emit).toHaveBeenCalledWith('status:update', { type: 'job:stopped', ...payload });
    });

    it('should broadcast job:retry', () => {
      const payload = { jobId: 'job-1', jobName: 'Test', retry: 1, maxRetries: 3 };
      gateway.onJobRetry(payload);
      expect(mockServer.emit).toHaveBeenCalledWith('job:retry', payload);
    });

    it('should emit job:log to room', () => {
      const payload = { jobId: 'job-1', line: '[2026-02-16] Some log line' };
      gateway.onJobLog(payload);
      expect(mockServer.to).toHaveBeenCalledWith('logs:job-1');
      expect(mockServer.emit).toHaveBeenCalledWith('job:log', payload);
    });
  });
});
