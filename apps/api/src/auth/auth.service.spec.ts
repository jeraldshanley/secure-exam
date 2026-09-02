import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
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
});
