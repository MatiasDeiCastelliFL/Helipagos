import axios from 'axios';
import { ServiceUnavailableException } from '@nestjs/common';

export const helipagosConfig = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.TOKEN_SECRET}`,
  },
  timeout: 5000,
};

/** Lanza `ServiceUnavailableException` ante timeout/red/5xx; en otro caso relanza `error`. */
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
  }
  throw error;
}
