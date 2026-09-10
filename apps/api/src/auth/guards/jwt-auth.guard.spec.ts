import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-secret'),
  };

  const createMockContext = (headers: Record<string, string>): ExecutionContext => {
    const request: any = { headers, user: null };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jest.clearAllMocks();
  });

  it('should allow access and attach user if token is valid', async () => {
    const context = createMockContext({ authorization: 'Bearer valid-token' });
    const payload = { sub: 'uuid-1', role: 'student' };
    mockJwtService.verifyAsync.mockResolvedValue(payload);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', { secret: 'mock-secret' });
    const req = context.switchToHttp().getRequest();
    expect(req['user']).toEqual(payload);
  });

  it('should throw UnauthorizedException if header is missing', async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if header is not Bearer', async () => {
    const context = createMockContext({ authorization: 'Basic valid-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token is invalid or expired', async () => {
    const context = createMockContext({ authorization: 'Bearer invalid-token' });
    mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
