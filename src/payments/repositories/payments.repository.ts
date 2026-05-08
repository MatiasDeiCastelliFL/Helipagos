import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from 'src/config/entities/payment.entity';
import { cipher } from 'src/config/encryption/encript';
import { VerifyCreateResponsePaymentDto } from '../dto/create-verify.dto';
import { WebhookDto } from '../dto/webhook';

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}
  async findPaymentByReferenciaExterna(
    referenciaExterna: string,
  ): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { referencia_externa: referenciaExterna },
    });
  }

  async findPaymentById(id: number): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { id },
    });
  }

  async findPaymentByIdSp(idSp: number): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { id_sp: idSp },
    });
  }

  async findDuplicateByReferenciaExternaAndIdSp(
    referenciaExterna: string,
    idSp: number,
  ): Promise<{ referenciaDuplicada: boolean; idSpDuplicado: boolean }> {
    const referenciaDuplicada =
      await this.findPaymentByReferenciaExterna(referenciaExterna);

    const idSpDuplicado = await this.findPaymentByIdSp(idSp);

    return {
      referenciaDuplicada: referenciaDuplicada !== null,
      idSpDuplicado: idSpDuplicado !== null,
    };
  }

  async createPayment(
    payment: VerifyCreateResponsePaymentDto,
  ): Promise<object> {
    const newPayment = this.paymentRepository.create({
      referencia_externa: payment.referencia_externa,
      idcliente: payment.id_cliente,
      importe: payment.importe,
      descripcion: payment.descripcion,
      id_sp: payment.id_sp,
      url_redirect: payment.checkout_url,
      webhook: payment?.webhook,
      estado: payment.estado,
      fecha_vto: payment.fecha_vencimiento,
      codigo_barra: cipher(JSON.stringify(payment.codigo_barra)),
      id_url: payment.id_url,
      short_url: payment.short_url,
      recargo: payment.recargo,
      fecha_vencimiento_2do: payment.fecha_vencimiento_2do,
      qr_data: cipher(JSON.stringify(payment.qr_data)),
    });

    await this.paymentRepository.save(newPayment);
    return {
      message: 'Pago creado correctamente',
      data: {
        id_sp: payment.id_sp,
        checkout_url: payment.checkout_url,
        estado: payment.estado,
      },
    };
  }

  async updatePayment(payment: Payment, webhook: WebhookDto): Promise<object> {
    payment.estado = webhook.estado?.trim().toUpperCase();
    payment.referencia_externa = webhook.referencia_externa;
    payment.medio_pago = webhook.medio_pago ?? null;
    payment.importe_abonado = webhook.importe_abonado ?? null;
    payment.fecha_importe = webhook.fecha_importe ?? null;
    await this.paymentRepository.save(payment);
    return {
      message: 'Estado en BD actualizado a PROCESADA',
    };
  }

  async cancelPayment(payment: Payment): Promise<object> {
    payment.estado = 'CANCELADA';
    await this.paymentRepository.save(payment);
    return {
      message: 'Pago cancelado correctamente',
    };
  }
}
