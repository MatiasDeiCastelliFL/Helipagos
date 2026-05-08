import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from 'src/config/entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsRepository } from './repositories/payments.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}
