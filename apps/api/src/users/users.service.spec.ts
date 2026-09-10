import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findMe', () => {
    it('should return safe user fields when found', async () => {
      const user = { id: 'uuid', name: 'John', email: 'john@user.com', role: 'student', createdAt: new Date() };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findMe('uuid');
      
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findMe('uuid-missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return array of safely formatted users', async () => {
      const users = [{ id: 'uuid', name: 'John', email: 'john@user.com', role: 'student', createdAt: new Date() }];
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();
      
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      expect(result).toEqual(users);
    });
  });
});
