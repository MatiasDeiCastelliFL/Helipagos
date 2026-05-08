/**
 * URL base de la API Helipagos según entorno.
 * Usa las mismas variables que `.env` (PRODUCTION / NODE_ENV, URL_PRODUCTION, URL_TEST).
 */
export function getHelipagosApiBaseUrl(): string {
  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.PRODUCTION === 'true';

  const url: string | undefined = isProduction
    ? process.env.URL_PRODUCTION
    : process.env.URL_TEST;

  if (url === undefined || url.length === 0) {
    throw new Error(
      `Definir ${isProduction ? 'URL_PRODUCTION' : 'URL_TEST'} en el archivo .env`,
    );
  }

  return `${url}/${process.env.URL_PREFIX}`;
}
