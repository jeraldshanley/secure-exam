import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;

  const mockPrisma = {
    exam: {
      findUnique: jest.fn(),
    },
    question: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a question linked to the exam when exam exists', async () => {
      const examId = 'exam-uuid-1';
      const dto = {
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5'],
        correctOption: 1,
      };
      const mockExam = { id: examId, title: 'Math Exam', duration: 60, status: 'draft' };
      const expectedQuestion = { id: 'q-uuid-1', examId, ...dto, createdAt: new Date() };

      mockPrisma.exam.findUnique.mockResolvedValue(mockExam);
      mockPrisma.question.create.mockResolvedValue(expectedQuestion);

      const result = await service.create(examId, dto);

      expect(mockPrisma.exam.findUnique).toHaveBeenCalledWith({ where: { id: examId } });
      expect(mockPrisma.question.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          examId,
        },
      });
      expect(result).toEqual(expectedQuestion);
    });

    it('should throw NotFoundException if exam does not exist', async () => {
      const examId = 'invalid-exam-id';
      const dto = {
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5'],
        correctOption: 1,
      };

      mockPrisma.exam.findUnique.mockResolvedValue(null);

      await expect(service.create(examId, dto)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.exam.findUnique).toHaveBeenCalledWith({ where: { id: examId } });
      expect(mockPrisma.question.create).not.toHaveBeenCalled();
    });
  });

  describe('findByExam', () => {
    it('should return all questions for the given examId', async () => {
      const examId = 'exam-uuid-1';
      const mockQuestions = [
        { id: 'q-1', examId, questionText: 'Q1', options: ['A', 'B'], correctOption: 0 },
        { id: 'q-2', examId, questionText: 'Q2', options: ['C', 'D'], correctOption: 1 },
      ];

      mockPrisma.question.findMany.mockResolvedValue(mockQuestions);

      const result = await service.findByExam(examId);

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({ where: { examId } });
      expect(result).toEqual(mockQuestions);
    });
  });
});
