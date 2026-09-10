import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findMe: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  const generateMockReq = (sub: string, role: string) => {
    return { user: { sub, role } } as any;
  };

  describe('findMe', () => {
    it('should extract sub from user token and delegate to UsersService', async () => {
      const expectedUser = { id: 'uuid', name: 'John', email: 'john@user.com', role: 'student', createdAt: new Date() };
      mockUsersService.findMe.mockResolvedValue(expectedUser);

      const req = generateMockReq('uuid', 'student');
      const result = await controller.findMe(req);

      expect(mockUsersService.findMe).toHaveBeenCalledWith('uuid');
      expect(result).toEqual(expectedUser);
    });
  });

  describe('findAll', () => {
    it('should delegate to UsersService if user is admin', async () => {
      const expectedUsers = [{ id: 'uuid', name: 'John', email: 'john@user.com', role: 'admin', createdAt: new Date() }];
      mockUsersService.findAll.mockResolvedValue(expectedUsers);

      const req = generateMockReq('uuid', 'admin');
      const result = await controller.findAll(req);

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedUsers);
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const req = generateMockReq('uuid', 'student');

      expect(() => controller.findAll(req)).toThrow(ForbiddenException);
    });
  });
});
