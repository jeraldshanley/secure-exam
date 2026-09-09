import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ExamsService', () => {
  let service: ExamsService;

  const mockPrisma = {
    exam: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new exam with draft status', async () => {
      const dto = { title: 'Midterm', duration: 120 };
      const createdExam = { id: 'uuid-1', ...dto, status: 'draft', createdAt: new Date() };
      
      mockPrisma.exam.create.mockResolvedValue(createdExam);

      const result = await service.create(dto);

      expect(mockPrisma.exam.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(createdExam);
    });
  });

  describe('findAll', () => {
    it('should return an array of exams', async () => {
      const exams = [{ id: 'uuid-1', title: 'Midterm', duration: 120, status: 'draft' }];
      mockPrisma.exam.findMany.mockResolvedValue(exams);

      const result = await service.findAll();

      expect(mockPrisma.exam.findMany).toHaveBeenCalled();
      expect(result).toEqual(exams);
    });
  });

  describe('findOne', () => {
    it('should return an exam if it exists', async () => {
      const exam = { id: 'uuid-1', title: 'Midterm', duration: 120, status: 'draft' };
      mockPrisma.exam.findUnique.mockResolvedValue(exam);

      const result = await service.findOne('uuid-1');

      expect(mockPrisma.exam.findUnique).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
      expect(result).toEqual(exam);
    });

    it('should throw NotFoundException if exam does not exist', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(null);

      await expect(service.findOne('uuid-unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
