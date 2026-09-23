import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  async startAttempt(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    return this.prisma.attempt.create({
      data: { userId, examId, status: 'in_progress' },
    });
  }

  async submitAnswer(
    userId: string,
    attemptId: string,
    dto: SubmitAnswerDto,
  ) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }
    if (attempt.userId !== userId) {
      throw new ForbiddenException('You do not own this attempt');
    }
    if (attempt.status !== 'in_progress') {
      throw new ForbiddenException('Cannot answer a submitted attempt');
    }

    return this.prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
      update: { selectedOption: dto.selectedOption },
      create: {
        attemptId,
        questionId: dto.questionId,
        selectedOption: dto.selectedOption,
      },
    });
  }

  async submitAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }
    if (attempt.userId !== userId) {
      throw new ForbiddenException('You do not own this attempt');
    }
    if (attempt.status !== 'in_progress') {
      throw new ForbiddenException('Attempt has already been submitted');
    }

    const answers = await this.prisma.answer.findMany({
      where: { attemptId },
      include: { question: true },
    });

    const score = answers.filter(
      (a) => a.selectedOption === a.question.correctOption,
    ).length;

    return this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        score,
      },
    });
  }

  async findOne(requesterId: string, requesterRole: string, attemptId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    const isOwner = attempt.userId === requesterId;
    const isPrivileged = requesterRole === 'faculty' || requesterRole === 'admin';

    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException(
        'You do not have permission to view this attempt',
      );
    }

    return attempt;
  }
}
