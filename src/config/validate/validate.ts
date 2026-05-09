import { ConflictException } from '@nestjs/common';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendario UTC `YYYY-MM-DD` (mismo criterio que suele usar Helipagos al parsear la fecha). */
function todayIsoDateUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Helipagos trata `YYYY-MM-DD` como inicio de ese día en UTC (00:00:00Z) y lo
 * compara con la hora actual. Ese instante es siempre anterior a cualquier
 * momento del mismo día calendario UTC, así que `fecha_vto` debe ser
 * estrictamente posterior al día UTC actual (en la práctica, desde mañana en UTC).
 */
export const validateFechaVto = (fecha_vto: string) => {
  if (!ISO_DATE.test(fecha_vto)) {
    return false;
  }
  return fecha_vto > todayIsoDateUtc();
};

export const validateFechaVto2do = (
  fecha_vto_2do: string,
  fecha_vto: string,
) => {
  if (!ISO_DATE.test(fecha_vto_2do) || !ISO_DATE.test(fecha_vto)) {
    return false;
  }
  return fecha_vto_2do > fecha_vto;
};

export const fechaValidate = (fecha_vto: string, fecha_vto_2do: string) => {
  if (!validateFechaVto(fecha_vto)) {
    throw new ConflictException(
      'La fecha de vencimiento debe ser posterior al día actual (criterio UTC, alineado con Helipagos)',
    );
  }
  if (!validateFechaVto2do(fecha_vto_2do, fecha_vto)) {
    throw new ConflictException(
      'La fecha de vencimiento 2do debe ser mayor que la fecha de vencimiento',
    );
  }
};
