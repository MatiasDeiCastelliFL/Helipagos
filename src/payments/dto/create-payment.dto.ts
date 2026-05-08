import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ISO_8601_DATE_ONLY } from 'src/config/rules';

export class CreatePaymentDto {
  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: 'El importe debe ser un número' },
  )
  @Min(1, { message: 'El importe debe ser mayor o igual que 1' })
  importe: number;

  @Matches(ISO_8601_DATE_ONLY, {
    message: 'La fecha de vencimiento debe ser ISO 8601: YYYY-MM-DD',
  })
  @IsDateString(
    { strict: true },
    {
      message: 'La fecha de vencimiento debe ser una fecha válida',
    },
  )
  fecha_vto: string;

  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: 'El recargo debe ser un número' },
  )
  @Min(1, { message: 'El recargo debe ser mayor o igual que 1' })
  recargo: number;

  @Matches(ISO_8601_DATE_ONLY, {
    message: 'La segunda fecha de vencimiento debe ser ISO 8601: YYYY-MM-DD',
  })
  @IsDateString(
    { strict: true },
    {
      message: 'La segunda fecha de vencimiento debe ser una fecha válida',
    },
  )
  fecha_2do_vto: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MinLength(1, { message: 'La descripción debe tener al menos 1 carácter' })
  @MaxLength(255, {
    message: 'La descripción debe ser menor o igual que 255 caracteres',
  })
  descripcion: string;

  @IsString({ message: 'La referencia externa debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'La referencia externa debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message: 'La referencia externa debe ser menor o igual que 255 caracteres',
  })
  referencia_externa: string;

  @IsString({ message: 'La referencia externa 2 debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'La referencia externa 2 debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message:
      'La referencia externa 2 debe ser menor o igual que 255 caracteres',
  })
  referencia_externa_2: string;

  @IsString({ message: 'La URL de redirección debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'La URL de redirección debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message: 'La URL de redirección debe ser menor o igual que 255 caracteres',
  })
  url_redirect: string;

  @IsString({ message: 'El webhook debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'El webhook debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message: 'El webhook debe ser menor o igual que 255 caracteres',
  })
  webhook: string;

  @IsBoolean({ message: 'El campo qr debe ser un booleano' })
  qr: boolean;
}
