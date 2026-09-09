import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExamDto: CreateExamDto) {
    return this.prisma.exam.create({
      data: createExamDto,
    });
  }

  async findAll() {
    return this.prisma.exam.findMany();
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return exam;
  }
}
