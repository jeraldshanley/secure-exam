import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('exams/:examId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('faculty', 'admin')
  create(
    @Param('examId') examId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.questionsService.create(examId, createQuestionDto);
  }

  @Get()
  findByExam(@Param('examId') examId: string) {
    return this.questionsService.findByExam(examId);
  }
}
