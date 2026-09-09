import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsPositive()
  duration: number;
}
