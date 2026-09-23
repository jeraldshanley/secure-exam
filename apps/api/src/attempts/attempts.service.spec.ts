import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AttemptsService', () => {
  let service: AttemptsService;

  const mockPrisma = {
    exam: { findUnique: jest.fn() },
    attempt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    answer: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AttemptsService>(AttemptsService);
    jest.clearAllMocks();
  });

  // ─── startAttempt ────────────────────────────────────────────────────────────

  describe('startAttempt', () => {
    it('should create an in_progress attempt when exam exists', async () => {
      const exam = { id: 'exam-1', title: 'Math' };
      const attempt = { id: 'att-1', userId: 'user-1', examId: 'exam-1', status: 'in_progress' };
      mockPrisma.exam.findUnique.mockResolvedValue(exam);
      mockPrisma.attempt.create.mockResolvedValue(attempt);

      const result = await service.startAttempt('user-1', 'exam-1');

      expect(mockPrisma.exam.findUnique).toHaveBeenCalledWith({ where: { id: 'exam-1' } });
      expect(mockPrisma.attempt.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', examId: 'exam-1', status: 'in_progress' },
      });
      expect(result).toEqual(attempt);
    });

    it('should throw NotFoundException when exam does not exist', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(null);

      await expect(service.startAttempt('user-1', 'exam-missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── submitAnswer ─────────────────────────────────────────────────────────────

  describe('submitAnswer', () => {
    const dto = { questionId: 'q-1', selectedOption: 2 };
    const attempt = { id: 'att-1', userId: 'user-1', examId: 'exam-1', status: 'in_progress' };

    it('should upsert an answer for a valid in_progress attempt', async () => {
      const answer = { id: 'ans-1', attemptId: 'att-1', questionId: 'q-1', selectedOption: 2 };
      mockPrisma.attempt.findUnique.mockResolvedValue(attempt);
      mockPrisma.answer.upsert.mockResolvedValue(answer);

      const result = await service.submitAnswer('user-1', 'att-1', dto);

      expect(mockPrisma.answer.upsert).toHaveBeenCalledWith({
        where: { attemptId_questionId: { attemptId: 'att-1', questionId: 'q-1' } },
        update: { selectedOption: 2 },
        create: { attemptId: 'att-1', questionId: 'q-1', selectedOption: 2 },
      });
      expect(result).toEqual(answer);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue(null);

      await expect(service.submitAnswer('user-1', 'att-missing', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when userId does not match attempt owner', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ ...attempt, userId: 'other-user' });

      await expect(service.submitAnswer('user-1', 'att-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when attempt is already submitted', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ ...attempt, status: 'submitted' });

      await expect(service.submitAnswer('user-1', 'att-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── submitAttempt ────────────────────────────────────────────────────────────

  describe('submitAttempt', () => {
    const attempt = { id: 'att-1', userId: 'user-1', examId: 'exam-1', status: 'in_progress' };

    it('should calculate score and mark attempt as submitted', async () => {
      const answers = [
        { selectedOption: 1, question: { correctOption: 1 } }, // correct
        { selectedOption: 0, question: { correctOption: 2 } }, // wrong
      ];
      const updated = { ...attempt, status: 'submitted', score: 1 };
      mockPrisma.attempt.findUnique.mockResolvedValue(attempt);
      mockPrisma.answer.findMany.mockResolvedValue(answers);
      mockPrisma.attempt.update.mockResolvedValue(updated);

      const result = await service.submitAttempt('user-1', 'att-1');

      expect(mockPrisma.attempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'att-1' },
          data: expect.objectContaining({ status: 'submitted', score: 1 }),
        }),
      );
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue(null);

      await expect(service.submitAttempt('user-1', 'att-missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when requester is not the owner', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ ...attempt, userId: 'other-user' });

      await expect(service.submitAttempt('user-1', 'att-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when attempt is already submitted', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ ...attempt, status: 'submitted' });

      await expect(service.submitAttempt('user-1', 'att-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    const attempt = { id: 'att-1', userId: 'user-1', examId: 'exam-1', status: 'in_progress', answers: [] };

    it('should return attempt with answers when requester is the owner', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue(attempt);

      const result = await service.findOne('user-1', 'student', 'att-1');

      expect(result).toEqual(attempt);
    });

    it('should return attempt with answers when requester has role faculty', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ ...attempt, userId: 'other-user' });

      const result = await service.findOne('faculty-user', 'faculty', 'att-1');

      expect(result).toBeDefined();
    });

    it('should return attempt with answers when requester has role admin', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ ...attempt, userId: 'other-user' });

      const result = await service.findOne('admin-user', 'admin', 'att-1');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'student', 'att-missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when requester is not owner and not privileged', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ ...attempt, userId: 'other-user' });

      await expect(service.findOne('user-1', 'student', 'att-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
