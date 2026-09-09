import { Test, TestingModule } from '@nestjs/testing';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

describe('ExamsController', () => {
  let controller: ExamsController;

  const mockExamsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamsController],
      providers: [
        { provide: ExamsService, useValue: mockExamsService },
      ],
    }).compile();

    controller = module.get<ExamsController>(ExamsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should delegate to ExamsService.create', async () => {
      const dto = { title: 'Midterm', duration: 120 };
      const expectedResult = { id: 'uuid-1', ...dto, status: 'draft' };
      mockExamsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(mockExamsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should delegate to ExamsService.findAll', async () => {
      const expectedResult = [{ id: 'uuid-1', title: 'Midterm', duration: 120, status: 'draft' }];
      mockExamsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(mockExamsService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should delegate to ExamsService.findOne', async () => {
      const expectedResult = { id: 'uuid-1', title: 'Midterm', duration: 120, status: 'draft' };
      mockExamsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('uuid-1');

      expect(mockExamsService.findOne).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual(expectedResult);
    });
  });
});
