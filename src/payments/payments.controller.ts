import {
  Body,
  Controller,
  Put,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GetPaymentDto } from './dto/get-payment.dto';
import { PaymentsService } from './payments.service';
import { WebhookDto } from './dto/webhook';
import { CancelPaymentDto } from './dto/cancel-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<object> {
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getPayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.getPayment(id);
  }
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() webhookDto: WebhookDto): Promise<object> {
    return this.paymentsService.webhook(webhookDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  cancelPayment(@Param() cancelPaymentDto: CancelPaymentDto): Promise<object> {
    return this.paymentsService.cancelPayment(cancelPaymentDto);
  }
}
