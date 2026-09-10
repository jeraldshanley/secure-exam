import { Controller, Get, Request, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  findMe(@Request() req: any) {
    const userId = req.user.sub;
    return this.usersService.findMe(userId);
  }

  @Get()
  findAll(@Request() req: any) {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.usersService.findAll();
  }
}
