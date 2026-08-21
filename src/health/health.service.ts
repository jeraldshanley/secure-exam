import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      service: 'secure-exam-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
