import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class WebhookDto {
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'El id_sp debe ser un número' })
  @IsNotEmpty({ message: 'El id_sp es requerido' })
  id_sp: number;
  @IsString({ message: 'El estado debe ser un string' })
  @IsNotEmpty({ message: 'El estado es requerido' })
  estado: string;
  @IsString()
  @IsNotEmpty()
  referencia_externa: string;
  @IsString()
  @IsOptional()
  medio_pago: string;
  @IsString()
  @IsOptional()
  importe_abonado?: string;
  @IsString()
  @IsOptional()
  fecha_importe: string;
}
