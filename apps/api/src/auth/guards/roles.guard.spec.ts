import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    jest.clearAllMocks();
  });

  function createMockExecutionContext(user?: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles metadata is set', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockExecutionContext({ role: 'student' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if roles metadata is empty', () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockExecutionContext({ role: 'student' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user role is included in allowed roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['faculty', 'admin']);
    const context = createMockExecutionContext({ role: 'faculty' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user role is admin and admin is allowed', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['faculty', 'admin']);
    const context = createMockExecutionContext({ role: 'admin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user role is not in allowed roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['faculty', 'admin']);
    const context = createMockExecutionContext({ role: 'student' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user object is missing', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user role is missing', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockExecutionContext({});

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
