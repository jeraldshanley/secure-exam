import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(examId: string, createQuestionDto: CreateQuestionDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    return this.prisma.question.create({
      data: {
        ...createQuestionDto,
        examId,
      },
    });
  }

  async findByExam(examId: string) {
    return this.prisma.question.findMany({
      where: { examId },
    });
  }
}
