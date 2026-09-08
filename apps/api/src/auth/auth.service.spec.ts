import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto = { name: 'Jane Doe', email: 'jane@example.com', password: 'securepass' };

    it('should create a user and return without passwordHash', async () => {
      const createdAt = new Date();
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        name: dto.name,
        email: dto.email,
        passwordHash: 'hashed',
        role: 'student',
        createdAt,
      });

      const result = await service.register(dto);

      expect(result).toEqual({
        id: 'uuid-1',
        name: dto.name,
        email: dto.email,
        role: 'student',
        createdAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should hash the password with bcrypt (10 rounds)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }) => ({
        id: 'uuid-2',
        ...data,
        role: 'student',
        createdAt: new Date(),
      }));

      await service.register(dto);

      const hashedPassword = mockPrisma.user.create.mock.calls[0][0].data.passwordHash;
      const isValid = await bcrypt.compare(dto.password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-uuid' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto = { email: 'jane@example.com', password: 'securepass' };

    it('should return token and user without passwordHash on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        name: 'Jane Doe',
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: 'student',
      });
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.login(dto);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({ sub: 'uuid-1', role: 'student' });
      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: { id: 'uuid-1', name: 'Jane Doe', email: dto.email, role: 'student' },
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        name: 'Jane Doe',
        email: dto.email,
        passwordHash: await bcrypt.hash('wrongpass', 10),
        role: 'student',
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
