import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { getHelipagosApiBaseUrl } from 'src/config/env.config';
import axios from 'axios';
import {
  handleHelipagosError,
  helipagosConfig,
} from 'src/config/helipagos.config';
import { VerifyCreateResponsePaymentDto } from './dto/create-verify.dto';
import { fechaValidate } from 'src/config/validate/validate';
import { PaymentsRepository } from './repositories/payments.repository';
import { GetPaymentDto } from './dto/get-payment.dto';
import { WebhookDto } from './dto/webhook';
import { normalizeHelipagosConsultaBody } from './dto/helipagos-consulta.dto';
import { CancelPaymentDto } from './dto/cancel-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private paymentsRepository: PaymentsRepository) {}
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<object> {
    fechaValidate(createPaymentDto.fecha_vto, createPaymentDto.fecha_2do_vto);
    try {
      const response = await axios.post<VerifyCreateResponsePaymentDto>(
        getHelipagosApiBaseUrl() + '/solicitud_pago/v1/checkout/solicitud_pago',
        createPaymentDto,
        helipagosConfig,
      );

      const data: VerifyCreateResponsePaymentDto = response.data;
      data.webhook = createPaymentDto.webhook;
      const duplicate =
        await this.paymentsRepository.findDuplicateByReferenciaExternaAndIdSp(
          data.referencia_externa,
          data.id_sp,
        );

      if (duplicate.referenciaDuplicada) {
        throw new ConflictException(
          'La referencia externa ya se encuentra duplicada',
        );
      }
      if (duplicate.idSpDuplicado) {
        throw new ConflictException('El id_sp ya se encuentra duplicado');
      }
      return await this.paymentsRepository.createPayment(data);
    } catch (error: unknown) {
      handleHelipagosError(error);
    }
  }

  async getPayment(getPaymentDto: GetPaymentDto): Promise<object> {
    const idNumber = Number(getPaymentDto.id);
    if (!Number.isInteger(idNumber)) {
      throw new ConflictException('El id no es un número válido');
    }
    const payment = await this.paymentsRepository.findPaymentById(idNumber);
    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    try {
      const response = await axios.get<unknown>(
        getHelipagosApiBaseUrl() +
          '/solicitud_pago/v1/get_solicitud_pago?id=' +
          payment.id_sp,
        helipagosConfig,
      );

      const helipagosItem = normalizeHelipagosConsultaBody(response.data);
      return {
        local: payment,
        helipagos: helipagosItem,
        estadoHelipagos:
          helipagosItem?.estado_pago?.trim().toUpperCase() ??
          helipagosItem?.estado?.trim().toUpperCase() ??
          null,
      };
    } catch (error: unknown) {
      handleHelipagosError(error);
    }
  }

  async webhook(webhookDto: WebhookDto): Promise<object> {
    const payment = await this.paymentsRepository.findPaymentByIdSp(
      webhookDto.id_sp,
    );
    if (!payment) {
      this.logger.warn(
        `Webhook: id_sp sin fila en BD (ack 200). id_sp=${String(webhookDto.id_sp)} referencia_externa=${webhookDto.referencia_externa ?? 'n/a'} estado=${webhookDto.estado?.trim().toUpperCase()}`,
      );
      return { acknowledged: true };
    }

    if (payment.estado?.trim().toUpperCase() === 'PROCESADA') {
      return { acknowledged: true, alreadyProcessed: true };
    }

    if (webhookDto.estado?.trim().toUpperCase() !== 'PROCESADA') {
      throw new ConflictException(
        'El valor del estado no es valido para el webhook de pago, debe ser PROCESADA',
      );
    }

    return await this.paymentsRepository.updatePayment(payment, webhookDto);
  }

  async cancelPayment(cancelPaymentDto: CancelPaymentDto): Promise<object> {
    try {
      const idNumber = Number(cancelPaymentDto.id);
      if (!Number.isInteger(idNumber)) {
        throw new ConflictException('El id no es un número válido');
      }
      const payment = await this.paymentsRepository.findPaymentById(idNumber);
      if (!payment) {
        throw new NotFoundException('Pago no encontrado');
      }
      const allowed =
        payment.estado.trim().toUpperCase() === 'GENERADA' ||
        payment.estado.trim().toUpperCase() === 'RECHAZADA';
      if (!allowed) {
        throw new ConflictException(
          'Solo se puede cancelar si el estado está en GENERADA o RECHAZADA',
        );
      }

      const response = await axios.put<unknown>(
        getHelipagosApiBaseUrl() +
          '/solicitud_pago/v1/checkout/cancelacion_solicitud_pago?id=' +
          payment.id_sp,
        {},
        helipagosConfig,
      );

      if (response.status === 200) {
        return await this.paymentsRepository.cancelPayment(payment);
      }
      throw new ConflictException('Error al cancelar el pago');
    } catch (error: unknown) {
      handleHelipagosError(error);
    }
  }
}
