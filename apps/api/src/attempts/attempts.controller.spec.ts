import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('AttemptsController', () => {
  let controller: AttemptsController;

  const mockAttemptsService = {
    startAttempt: jest.fn(),
    submitAnswer: jest.fn(),
    submitAttempt: jest.fn(),
    findOne: jest.fn(),
  };

  const mockReq = { user: { sub: 'user-1', role: 'student' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttemptsController],
      providers: [
        { provide: AttemptsService, useValue: mockAttemptsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AttemptsController>(AttemptsController);
    jest.clearAllMocks();
  });

  describe('startAttempt', () => {
    it('should delegate to AttemptsService.startAttempt with userId and examId', async () => {
      const expected = { id: 'att-1', userId: 'user-1', examId: 'exam-1', status: 'in_progress' };
      mockAttemptsService.startAttempt.mockResolvedValue(expected);

      const result = await controller.startAttempt('exam-1', mockReq);

      expect(mockAttemptsService.startAttempt).toHaveBeenCalledWith('user-1', 'exam-1');
      expect(result).toEqual(expected);
    });
  });

  describe('submitAnswer', () => {
    it('should delegate to AttemptsService.submitAnswer with userId, attemptId, and dto', async () => {
      const dto = { questionId: 'q-1', selectedOption: 2 };
      const expected = { id: 'ans-1', attemptId: 'att-1', questionId: 'q-1', selectedOption: 2 };
      mockAttemptsService.submitAnswer.mockResolvedValue(expected);

      const result = await controller.submitAnswer('att-1', dto, mockReq);

      expect(mockAttemptsService.submitAnswer).toHaveBeenCalledWith('user-1', 'att-1', dto);
      expect(result).toEqual(expected);
    });
  });

  describe('submitAttempt', () => {
    it('should delegate to AttemptsService.submitAttempt with userId and attemptId', async () => {
      const expected = { id: 'att-1', status: 'submitted', score: 3 };
      mockAttemptsService.submitAttempt.mockResolvedValue(expected);

      const result = await controller.submitAttempt('att-1', mockReq);

      expect(mockAttemptsService.submitAttempt).toHaveBeenCalledWith('user-1', 'att-1');
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to AttemptsService.findOne with requesterId, role, and attemptId', async () => {
      const expected = { id: 'att-1', userId: 'user-1', answers: [] };
      mockAttemptsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('att-1', mockReq);

      expect(mockAttemptsService.findOne).toHaveBeenCalledWith('user-1', 'student', 'att-1');
      expect(result).toEqual(expected);
    });
  });
});
