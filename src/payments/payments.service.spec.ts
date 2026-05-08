import { ConflictException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './repositories/payments.repository';

jest.mock('axios');

describe('PaymentsService.cancelPayment', () => {
  const buildService = (repoOverrides: Partial<PaymentsRepository> = {}) => {
    const findPaymentByIdMock = jest.fn();
    const cancelPaymentMock = jest.fn();
    const effectiveCancelPaymentMock =
      (repoOverrides.cancelPayment as unknown as jest.Mock | undefined) ??
      cancelPaymentMock;
    const repo = {
      findPaymentById: findPaymentByIdMock,
      cancelPayment: effectiveCancelPaymentMock,
      ...repoOverrides,
    } as unknown as PaymentsRepository;

    return {
      service: new PaymentsService(repo),
      repo,
      findPaymentByIdMock,
      cancelPaymentMock: effectiveCancelPaymentMock,
    };
  };

  it('throws NotFoundException when payment does not exist', async () => {
    const { service, cancelPaymentMock } = buildService({
      findPaymentById: jest.fn().mockResolvedValue(null),
    });

    await expect(service.cancelPayment({ id: '999' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(cancelPaymentMock).not.toHaveBeenCalled();
  });

  it('throws ConflictException when status is not cancellable', async () => {
    const { service, cancelPaymentMock } = buildService({
      findPaymentById: jest.fn().mockResolvedValue({
        id: 1,
        estado: 'PROCESADA',
      }),
    });

    await expect(service.cancelPayment({ id: '1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(cancelPaymentMock).not.toHaveBeenCalled();
  });

  it('cancels payment when status is GENERADA and helipagos returns 200', async () => {
    process.env.URL_TEST = 'https://sandbox.example.com';
    process.env.URL_PREFIX = 'api';
    process.env.PRODUCTION = 'false';

    const expected = { message: 'Pago cancelado correctamente' };
    const { service, cancelPaymentMock } = buildService({
      findPaymentById: jest.fn().mockResolvedValue({
        id: 1,
        id_sp: 706047,
        estado: 'GENERADA',
      }),
      cancelPayment: jest.fn().mockResolvedValue(expected),
    });

    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.put.mockResolvedValue({
      status: 200,
      data: {},
    });

    await expect(service.cancelPayment({ id: '1' })).resolves.toEqual(expected);
    expect(cancelPaymentMock).toHaveBeenCalledTimes(1);
  });
});
