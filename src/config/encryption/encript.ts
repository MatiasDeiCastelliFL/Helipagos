import Aes from 'aes-256-gcm';
import {
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

type AesEncryptedPayload = {
  ciphertext: string;
  iv: string;
  tag: string;
};

type Aes256GcmLib = {
  encrypt: (data: string, secret: string) => AesEncryptedPayload;
  decrypt: (payload: AesEncryptedPayload, secret: string) => string;
};

const getEncryptionSecret = (): string => {
  const sharedSecret =
    process.env.ENCRYPTION_SECRET ?? process.env.TOKEN_SECRET;
  if (!sharedSecret) {
    throw new ServiceUnavailableException('Configuracion de cifrado invalida');
  }

  const cleanSecret = sharedSecret.trim().replace(/^['"]|['"]$/g, '');
  if (!cleanSecret) {
    throw new ServiceUnavailableException('Configuracion de cifrado invalida');
  }

  const isStrongSecret =
    cleanSecret.length >= 32 &&
    /[a-z]/.test(cleanSecret) &&
    /[A-Z]/.test(cleanSecret) &&
    /\d/.test(cleanSecret) &&
    /[^A-Za-z0-9]/.test(cleanSecret);

  if (!isStrongSecret) {
    throw new ServiceUnavailableException(
      'ENCRYPTION_SECRET no cumple la politica de seguridad',
    );
  }

  return cleanSecret;
};

const getNormalizedSecret = (): string =>
  createHash('sha256').update(getEncryptionSecret()).digest('hex').slice(0, 32);

export const cipher = (data: string): AesEncryptedPayload => {
  try {
    const normalizedSecret = getNormalizedSecret();
    const aes = Aes as unknown as Aes256GcmLib;
    const encrypted = aes.encrypt(data, normalizedSecret);
    return {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      tag: encrypted.tag,
    };
  } catch (error: unknown) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException('No se pudo cifrar la informacion');
  }
};

export const decipher = (payload: AesEncryptedPayload): string => {
  try {
    const normalizedSecret = getNormalizedSecret();
    const aes = Aes as unknown as Aes256GcmLib;
    return aes.decrypt(payload, normalizedSecret);
  } catch (error: unknown) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(
      'No se pudo descifrar la informacion',
    );
  }
};
