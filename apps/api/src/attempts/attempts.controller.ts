import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('exams/:examId/attempts')
  @UseGuards(JwtAuthGuard)
  startAttempt(@Param('examId') examId: string, @Request() req: any) {
    return this.attemptsService.startAttempt(req.user.sub, examId);
  }

  @Post('attempts/:id/answers')
  @UseGuards(JwtAuthGuard)
  submitAnswer(
    @Param('id') id: string,
    @Body() dto: SubmitAnswerDto,
    @Request() req: any,
  ) {
    return this.attemptsService.submitAnswer(req.user.sub, id, dto);
  }

  @Post('attempts/:id/submit')
  @UseGuards(JwtAuthGuard)
  submitAttempt(@Param('id') id: string, @Request() req: any) {
    return this.attemptsService.submitAttempt(req.user.sub, id);
  }

  @Get('attempts/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.attemptsService.findOne(req.user.sub, req.user.role, id);
  }
}
