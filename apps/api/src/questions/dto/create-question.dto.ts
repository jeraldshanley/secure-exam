import { IsArray, IsInt, IsNotEmpty, IsString, Min, ArrayMinSize } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  options: string[];

  @IsInt()
  @Min(0)
  correctOption: number;
}
