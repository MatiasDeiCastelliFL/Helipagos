import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 255, unique: true })
  referencia_externa: string; //referencia_externa
  @Column({ type: 'int' })
  idcliente: number; //id_cliente
  @Column({ type: 'varchar', length: 255 })
  importe: number; // importe
  @Column({ type: 'varchar', length: 255 })
  descripcion: string; //descripcion
  @Column({ type: 'int', unique: true })
  id_sp: number;
  @Column({ type: 'varchar', length: 255 })
  url_redirect: string; //checkout_url
  @Column({ type: 'varchar', length: 255 })
  webhook: string;
  @Column({ type: 'varchar', length: 255 })
  estado: string; //estado
  @Column({ type: 'varchar', length: 255, nullable: true })
  medio_pago: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true })
  importe_abonado: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true })
  fecha_importe: string | null;
  @Column({ type: 'varchar', length: 255 })
  fecha_vto: Date; //fecha_vencimiento
  @Column({ type: 'jsonb', nullable: true })
  codigo_barra: Record<string, unknown> | null; //codigo_barra
  @Column({ type: 'varchar', length: 255 })
  @CreateDateColumn()
  createdAt: Date; //fecha_creacion
  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ type: 'varchar', length: 255 })
  id_url: string; //id_url
  @Column({ type: 'varchar', length: 255 })
  short_url: string; //short_url
  @Column({ type: 'int' })
  recargo: number; //recargo
  @Column({ type: 'varchar', length: 255 })
  fecha_vencimiento_2do: Date; //fecha_vencimiento_2do
  @Column({ type: 'jsonb', nullable: true })
  qr_data: Record<string, unknown> | null; //qr_data
}
