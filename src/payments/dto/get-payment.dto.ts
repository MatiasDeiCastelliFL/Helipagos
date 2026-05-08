import { IsNotEmpty, IsString } from 'class-validator';

export class GetPaymentDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
