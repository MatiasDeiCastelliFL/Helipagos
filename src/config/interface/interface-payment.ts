export type InterfacePayment = {
  id: number;
  referencia_externa: string;
  idcliente: number;
  importe: number;
  descripcion: string;
  id_sp: number;
  url_redirect: string;
  webhook: string;
  estado: string;
  fecha_vto: Date;
  codigo_barra: string;
  createdAt: Date;
  updatedAt: Date;
  id_url: string;
  short_url: string;
  recargo: number;
  fecha_vencimiento_2do: Date;
  qr_data?: string;
};

export interface HelipagosConsultaPagoItem {
  id_sp?: number;
  codigo_barra?: string;
  estado?: string;
  estado_pago?: string;
  medio_pago?: string;
  descripcion?: string;
  importe?: number;
  importe_vencido?: number;
  importe_pagado?: number;
  cuotas?: number;
  referencia_externa?: string;
  fecha_pago?: string;
  fecha_acreditacion?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_vencimiento?: string;
  segunda_fecha_vencimiento?: string | null;
}
