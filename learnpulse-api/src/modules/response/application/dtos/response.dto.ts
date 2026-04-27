import { IsUUID } from 'class-validator';

export class StartSessionDto {
  @IsUUID()
  formId!: string;
}
