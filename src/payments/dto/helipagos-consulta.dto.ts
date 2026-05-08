/**
 * Formato típico de cada elemento del array que devuelve el GET de consulta
 * de solicitud de pago (sandbox / producción pueden ampliar campos).
 */

import { HelipagosConsultaPagoItem } from 'src/config/interface/interface-payment';

export function normalizeHelipagosConsultaBody(
  data: unknown,
): HelipagosConsultaPagoItem | null {
  if (Array.isArray(data)) {
    const first: unknown = data[0];
    if (first !== undefined && typeof first === 'object' && first !== null) {
      // Helipagos: array de objetos con forma documentada (campos opcionales).
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- narrow desde unknown[]
      return first as HelipagosConsultaPagoItem;
    }
    return null;
  }
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return data as HelipagosConsultaPagoItem;
  }
  return null;
}
