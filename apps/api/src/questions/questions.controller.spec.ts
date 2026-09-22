import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('QuestionsController', () => {
  let controller: QuestionsController;

  const mockQuestionsService = {
    create: jest.fn(),
    findByExam: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        { provide: QuestionsService, useValue: mockQuestionsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<QuestionsController>(QuestionsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should delegate to QuestionsService.create', async () => {
      const examId = 'exam-uuid-1';
      const dto = {
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5'],
        correctOption: 1,
      };
      const expectedResult = { id: 'q-uuid-1', examId, ...dto };
      mockQuestionsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(examId, dto);

      expect(mockQuestionsService.create).toHaveBeenCalledWith(examId, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByExam', () => {
    it('should delegate to QuestionsService.findByExam', async () => {
      const examId = 'exam-uuid-1';
      const expectedResult = [
        { id: 'q-uuid-1', examId, questionText: 'Q1', options: ['A', 'B'], correctOption: 0 },
      ];
      mockQuestionsService.findByExam.mockResolvedValue(expectedResult);

      const result = await controller.findByExam(examId);

      expect(mockQuestionsService.findByExam).toHaveBeenCalledWith(examId);
      expect(result).toEqual(expectedResult);
    });
  });
});
