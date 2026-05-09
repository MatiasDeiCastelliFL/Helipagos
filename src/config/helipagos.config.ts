import axios from 'axios';
import { HttpException, ServiceUnavailableException } from '@nestjs/common';

export const helipagosConfig = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.TOKEN_SECRET}`,
  },
  timeout: 5000,
};

function helipagosResponseBody(data: unknown): Record<string, unknown> {
  if (data === null || data === undefined) {
    return { message: 'Respuesta inválida de Helipagos' };
  }
  if (typeof data === 'string') {
    return { message: data };
  }
  if (Array.isArray(data)) {
    try {
      return { errors: JSON.parse(JSON.stringify(data)) };
    } catch {
      return { message: 'Error en Helipagos' };
    }
  }
  if (typeof data === 'object') {
    try {
      return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
    } catch {
      return { message: 'Error en Helipagos' };
    }
  }
  if (typeof data === 'number' || typeof data === 'bigint') {
    return { message: data.toString() };
  }
  if (typeof data === 'boolean') {
    return { message: data ? 'true' : 'false' };
  }
  return { message: 'Error en Helipagos' };
}

/** Lanza `ServiceUnavailableException` ante timeout/red/5xx; 4xx como `HttpException` sin el `AxiosError` completo. */
export function handleHelipagosError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const code = error.code;
    const isTimeout = code === 'ECONNABORTED';
    const is5xx = status !== undefined && status >= 500;
    const isNetwork =
      code === 'ENOTFOUND' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNRESET';
    if (isTimeout || is5xx || isNetwork) {
      throw new ServiceUnavailableException(
        'Helipagos no disponible temporalmente',
      );
    }
    if (error.response && status !== undefined) {
      throw new HttpException(
        helipagosResponseBody(error.response.data),
        status,
      );
    }
    throw new ServiceUnavailableException(
      'Helipagos no disponible temporalmente',
    );
  }
  throw error;
}
