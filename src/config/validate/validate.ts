import { BadRequestException } from '@nestjs/common';

function parseDateOnlyLocal(isoDate: string): Date | null {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }
  const [y, m, d] = parts;
  if (y === undefined || m === undefined || d === undefined) {
    return null;
  }
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function startOfTodayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0);
}

/**
 * fecha_vto no puede ser anterior al día de hoy (calendario del proceso Node).
 * Usa >= para permitir vencimiento "hoy" (Helipagos / negocio) y evitar falsos
 * negativos en Docker UTC cuando el día ya cambió respecto a tu zona local.
 */
export const validateFechaVto = (fecha_vto: string) => {
  const inicioVto = parseDateOnlyLocal(fecha_vto);
  if (!inicioVto) {
    return false;
  }
  const hoyInicio = startOfTodayLocal();
  return inicioVto.getTime() >= hoyInicio.getTime();
};
export const validateFechaVto2do = (
  fecha_vto_2do: string,
  fecha_vto: string,
) => {
  const fecha2 = parseDateOnlyLocal(fecha_vto_2do);
  const fecha1 = parseDateOnlyLocal(fecha_vto);
  if (!fecha2 || !fecha1) {
    return false;
  }

  return fecha2.getTime() >= fecha1.getTime();
};

export const fechaValidate = (fecha_vto: string, fecha_vto_2do: string) => {
  if (!validateFechaVto(fecha_vto)) {
    throw new BadRequestException(
      'La fecha de vencimiento no puede ser anterior al día de hoy',
    );
  }
  if (!validateFechaVto2do(fecha_vto_2do, fecha_vto)) {
    throw new BadRequestException(
      'La fecha de vencimiento 2do debe ser mayor que la fecha de vencimiento',
    );
  }
};
