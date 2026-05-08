import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class VerifyCreateResponsePaymentDto {
  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: 'El importe debe ser un número' },
  )
  @Min(0, { message: 'El importe debe ser mayor o igual que 0' })
  importe: number;

  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: 'El recargo debe ser un número' },
  )
  @Min(0, { message: 'El recargo debe ser mayor o igual que 0' })
  recargo: number;

  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'El id_sp debe ser un número' })
  id_sp: number;

  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: 'El id_cliente debe ser un número' },
  )
  id_cliente: number;

  @IsString({ message: 'El estado debe ser una cadena de texto' })
  estado: string;
  @IsString({ message: 'La referencia externa debe ser una cadena de texto' })
  referencia_externa: string;

  @IsDateString(
    { strict: true },
    {
      message: 'La fecha de creación debe ser una fecha válida',
    },
  )
  fecha_creacion: string;

  @IsDateString(
    { strict: true },
    {
      message: 'La fecha de actualización debe ser una fecha válida',
    },
  )
  fecha_actualizacion: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MinLength(1, { message: 'La descripción debe tener al menos 1 carácter' })
  @MaxLength(255, {
    message: 'La descripción debe ser menor o igual que 255 caracteres',
  })
  descripcion: string;

  @IsString({ message: 'El código de barra debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'El código de barra debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message: 'El código de barra debe ser menor o igual que 255 caracteres',
  })
  codigo_barra: string;

  @IsString({ message: 'La referencia externa 2 debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'La referencia externa 2 debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message:
      'La referencia externa 2 debe ser menor o igual que 255 caracteres',
  })
  referencia_externa_2: string;

  @IsString({ message: 'La URL de checkout debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'La URL de checkout debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message: 'La URL de checkout debe ser menor o igual que 255 caracteres',
  })
  @IsUrl(
    { protocols: ['https'] },
    { message: 'La URL de checkout debe ser una URL válida' },
  )
  checkout_url: string;

  @IsString({ message: 'El id_url debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'El id_url debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message: 'El id_url debe ser menor o igual que 255 caracteres',
  })
  id_url: string;

  @IsString({ message: 'El short_url debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'El short_url debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message: 'El short_url debe ser menor o igual que 255 caracteres',
  })
  @IsUrl(
    { protocols: ['https'] },
    { message: 'El short_url debe ser una URL válida' },
  )
  short_url: string;

  @IsString({ message: 'El webhook debe ser una cadena de texto' })
  @IsOptional()
  webhook?: string;

  @IsDateString(
    { strict: true },
    {
      message: 'La fecha de vencimiento debe ser una fecha válida',
    },
  )
  fecha_vencimiento: string;
  @IsDateString(
    { strict: true },
    {
      message: 'La fecha de vencimiento debe ser una fecha válida',
    },
  )
  fecha_vencimiento_2do: string;

  @IsString({ message: 'El qr_data debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'El qr_data debe tener al menos 1 carácter',
  })
  @MaxLength(255, {
    message: 'El qr_data debe ser menor o igual que 255 caracteres',
  })
  qr_data: string;
}
