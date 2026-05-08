
## Descripcion

Repositorio base en TypeScript del framework [Nest](https://github.com/nestjs/nest).


# Requisitos previos

Antes de comenzar, asegurate de tener instalado:

- Node.js
- npm
- Git

## Descargar Node.js

Podés descargarlo desde el sitio oficial:

[Node.js](https://nodejs.org/es/download)

## Descargar Git

Podés descargar Git desde:

[Git SCM](https://git-scm.com/downloads)

## Verificar instalación

Abrí una terminal y ejecutá:

```bash
node -v
npm -v
git --version
```


## Configuracion del proyecto

```bash
# 1. Crear una carpeta para el proyecto
  $ mkdir mi-proyecto
# 2. Entrar a la carpeta creada
  $ cd mi-proyecto
# 3. Clonar el repositorio dentro de esa carpeta
  $ git clone https://github.com/MatiasDeiCastelliFL/Helipagos.git
# 4. Entrar al proyecto clonado
  $ cd Helipagos
# 5. Instalar dependencias
  $ npm install
```

## Compilar y ejecutar el proyecto

```bash
# desarrollo
$ npm run start

# modo watch
$ npm run start:dev

# modo produccion
$ npm run start:prod
```

Para levantar toda la solucion con Docker (API + PostgreSQL + pgAdmin), ejecutar:

```bash
docker compose up --build
```

## Estructura de carpetas y archivos

Vista orientativa del directorio `helipagos/` (archivos de configuracion en la raiz; codigo en `src/`):

```text
helipagos/
├── docker/
│   └── pgadmin/
│       └── init-pgadmin.sh      # Importa servidor PostgreSQL en pgAdmin al iniciar el contenedor
├── src/
│   ├── main.ts                  # Bootstrap: prefijo global `api`, ValidationPipe, puerto
│   ├── app.module.ts            # TypeORM + import de PaymentsModule
│   ├── config/
│   │   ├── entities/
│   │   │   └── payment.entity.ts
│   │   ├── encryption/
│   │   │   └── encript.ts
│   │   ├── validate/
│   │   │   └── validate.ts    # Reglas de fechas (fecha_vto, 2do vencimiento)
│   │   ├── interface/
│   │   │   └── interface-payment.ts
│   │   ├── env.config.ts
│   │   ├── helipagos.config.ts # Axios + handleHelipagosError
│   │   └── rules.ts
│   └── payments/
│       ├── dto/
│       │   ├── create-payment.dto.ts
│       │   ├── create-verify.dto.ts
│       │   ├── get-payment.dto.ts
│       │   ├── cancel-payment.dto.ts
│       │   ├── webhook.ts
│       │   └── helipagos-consulta.dto.ts  # Normaliza respuesta GET Helipagos (array u objeto)
│       ├── repositories/
│       │   └── payments.repository.ts     # Persistencia: crear, webhook, cancelar
│       ├── payments.controller.ts
│       ├── payments.service.ts
│       ├── payments.service.spec.ts      # Pruebas unitarias (cancelacion)
│       └── payments.module.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── nest-cli.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.build.json
├── body.json                   # Ejemplo de cuerpo JSON para stress tests (autocannon/ab)
├── pgadmin-servers.json        # Servidor `helipagos` precargado para pgAdmin
├── .env.example
└── README.md
```

| Ruta bajo `src/` | Rol |
|------------------|-----|
| `payments/*.controller.ts` | HTTP: rutas, codigos de respuesta, delegacion al servicio |
| `payments/*.service.ts` | Orquestacion: validaciones de negocio, llamadas a Helipagos, uso del repositorio |
| `payments/repositories/` | Acceso a datos TypeORM (`save`, `findOne`, etc.) |
| `payments/dto/` | Contratos de entrada y validacion `class-validator` |
| `config/entities/` | Modelo de tabla PostgreSQL |
| `config/helipagos.config.ts` | Cliente HTTP y manejo de errores hacia Helipagos |

## Decisiones de diseño

Resumen de criterios adoptados (complementa las secciones de API, webhook y concurrencia):

1. **Capas Nest:** el controlador solo expone HTTP; el **servicio** concentra reglas y llamadas a Helipagos; el **repositorio** concentra lectura/escritura TypeORM. Facilita pruebas unitarias y evita mezclar Axios con detalles de entidades en un solo archivo.
2. **`{id}` en rutas propias:** es la **clave primaria local** (`payments.id`). Helipagos se consulta siempre con el **`id_sp`** guardado en esa fila. Asi se evita ambigüedad con la consigna y se documenta el contrato para quien consume la API.
3. **Errores hacia Helipagos:** `handleHelipagosError` clasifica timeouts, 5xx y fallos de red en **503** con un mensaje unificado; el flujo de los servicios no queda con ramas sin cerrar en TypeScript.
4. **Webhook:** ante `id_sp` inexistente se responde **200** con cuerpo minimo y **log** de advertencia, para no disparar reintentos masivos del notificador. Si el pago ya estaba **PROCESADA**, **200** idempotente sin reescribir la fila.
5. **Concurrencia:** varias notificaciones sobre la misma fila se serializan en PostgreSQL; el diseno del webhook prioriza payloads repetibles del proveedor (ver seccion *Estrategia ante concurrencia*).
6. **Datos sensibles en BD:** `codigo_barra` y `qr_data` se persisten **cifrados**; la respuesta HTTP de creacion no los reexpone en claro.
7. **Esquema en desarrollo:** TypeORM usa **`synchronize: true`** cuando `PRODUCTION` no es `true`, de modo que al levantar Nest contra una base vacia se crean/ajustan tablas a partir de las entities. En produccion real conviene **migraciones** (ver *Roadmap*).

## API de pagos (Helipagos + PostgreSQL)

Prefijo global: `api` (`src/main.ts`). Recurso principal:

```http
POST /api/payments
Content-Type: application/json
```

En Docker la URL base suele ser `http://localhost:3009` (segun `PORT` en `.env`). En local, el mismo `PORT` del archivo de entorno.

### Rutas expuestas

| Metodo | Ruta | HTTP exito | Descripcion |
|--------|------|------------|-------------|
| POST | `/api/payments` | **201** | Crea la solicitud en Helipagos y persiste en PostgreSQL. |
| GET | `/api/payments/:id` | **200** | Busca en BD por **id interno** (`payments.id`). La llamada a Helipagos usa el **`id_sp`** de esa fila sobre `POST /api/solicitud_pago/v1/get_solicitud_pago?id={id_sp}`. |
| PUT | `/api/payments/:id` | **200** | Cancela la solicitud (si estado local es `GENERADA` o `RECHAZADA`) y marca `CANCELADA` en BD. Internamente consume `PUT .../cancelacion_solicitud_pago?id={id_sp}` en Helipagos. |
| POST | `/api/payments/webhook` | **200** | Notificacion de pago (p. ej. `estado` `PROCESADA`). |

> **Aclaracion de metodo en consulta Helipagos:**
> Aunque la consigna del servicio interno se implementa como `GET /api/payments/:id`, durante la integracion con Helipagos sandbox se verifico que la ruta `/solicitud_pago/v1/get_solicitud_pago` no acepta `GET`.
> Al probar con `GET`, Helipagos respondio `405 Method Not Allowed` con header `Allow: POST`.
> Por este motivo, la llamada **interna** hacia Helipagos se implemento con **`POST`** (manteniendo el endpoint publico propio en `GET`, segun la consigna).

### Formato de errores (NestJS)

Las excepciones HTTP responden en JSON similar a:

```json
{
  "statusCode": 400,
  "message": "texto o lista de errores de validacion",
  "error": "Bad Request"
}
```

| Codigo | `error` (tipico) | Origen / mensajes destacados |
|--------|------------------|------------------------------|
| **400** | Bad Request | DTO (`class-validator`), propiedades no permitidas, fechas en `fechaValidate`: *La fecha de vencimiento no puede ser anterior al día de hoy*; *La fecha de vencimiento 2do debe ser mayor que la fecha de vencimiento*. |
| **404** | Not Found | `GET /api/payments/:id` o `PUT /api/payments/:id` sin fila: *Pago no encontrado*. |
| **409** | Conflict | Crear: *La referencia externa ya se encuentra duplicada* o *El id_sp ya se encuentra duplicado*; `GET` / cancelar (`PUT`): *El id no es un número válido*; webhook: *El valor del estado no es valido para el webhook de pago, debe ser PROCESADA*; cancelar no permitido: *Solo se puede cancelar si el pago está en GENERADA o RECHAZADA*. |
| **503** | Service Unavailable | Helipagos no alcanzable: timeout, **5xx** de Helipagos, red (`ENOTFOUND`, `ECONNREFUSED`, `ETIMEDOUT`, `ECONNRESET`). Mensaje: **Helipagos no disponible temporalmente** (`handleHelipagosError` en `src/config/helipagos.config.ts`). Tambien **503** posible si `ENCRYPTION_SECRET` no cumple politica en `src/config/encryption/encript.ts`. |
| **Otros** | (varios) | Respuestas **4xx** de Helipagos no mapeadas a 503 se pueden propagar; revisar cuerpo y logs sin exponer secretos. |

Flujo HTTP: `createPayment` y `getPayment` delegan errores de Axios en `handleHelipagosError` (siempre relanza tras clasificar), asi el `catch` cierra el tipo y no queda respuesta implicita sin resolver.

### Como probar con curl

Defini `BASE` (bash: `export BASE=http://localhost:3009`; PowerShell: `$env:BASE="http://localhost:3009"`). Opcional: `-w "\nHTTP:%{http_code}\n"` al final del `curl` para ver el codigo HTTP.

# Configuración general

## URL base de la API

`$BASE` representa la URL base de tu API.

Ejemplos:

### Desarrollo local

```txt
http://localhost:3009
```

### Producción

```txt
https://api.tuapp.com
```

---

## Webhooks

El campo `webhook` debe ser una URL pública accesible desde internet.

Ejemplo:

```txt
https://<tu-subdominio>.trycloudflare.com/api/payments/webhook
```

Si configuraste `WEBHOOK_SECRET` en tu archivo `.env`, vas a tener que enviar el siguiente header:

```txt
X-Webhook-Secret: <tu_valor_en_.env>
```

---

### Guia explicita por endpoint (paso a paso para principiantes)

Antes de probar:
- Asegurate de que la API este corriendo en `http://localhost:3009`.
- Si configuraste `WEBHOOK_SECRET` en `.env`, vas a tener que enviar el header `X-Webhook-Secret` en `POST /api/payments/webhook`.

**A) Crear solicitud de pago** (`POST /api/payments`)
- URL: `POST $BASE/api/payments`
- Que enviar en el body: `importe`, `fecha_vto`, `recargo`, `fecha_2do_vto`, `descripcion`, `referencia_externa` (unica), `url_redirect`, `webhook`, `qr`.
- Importante sobre `webhook`: debe ser una URL publica tuya (ejemplo: `https://<tu-subdominio>.trycloudflare.com/api/payments/webhook`).
- Error comun: usar fechas vencidas o repetir `referencia_externa`.

**B) Consultar solicitud** (`GET /api/payments/:id`)
- URL: `GET $BASE/api/payments/{id}`
- Ese `id` es el ID local de tu BD (`payments.id`), no el `id_sp` de Helipagos.
- No lleva body.

**C) Recibir webhook** (`POST /api/payments/webhook`)
- URL: `POST $BASE/api/payments/webhook`
- Body minimo: `id_sp`, `estado`, `referencia_externa`.
- `estado` esperado para acreditar: `PROCESADA`.
- Si existe `WEBHOOK_SECRET`, enviar header: `X-Webhook-Secret: <tu_valor_en_.env>`.
- Este endpoint no usa `:id` en la URL; identifica por `id_sp` dentro del JSON.

**D) Cancelar solicitud** (`PUT /api/payments/:id`)
- URL: `PUT $BASE/api/payments/{id}`
- Ese `id` tambien es local (PK de `payments`).
- No lleva body.
- Solo permite cancelar si el estado local esta en `GENERADA` o `RECHAZADA`.

### Webhook publico con Cloudflare Tunnel (opcional)

Si queres que Helipagos notifique a tu API local desde Internet, podes exponerla temporalmente con `cloudflared`:

```bash
cloudflared tunnel --url http://localhost:3009
```

`cloudflared` mostrara una URL publica temporal como `https://<tu-subdominio>.trycloudflare.com`.

Con el prefijo global `api`, el webhook completo que debes enviar al crear el pago es:

```text
https://<tu-subdominio>.trycloudflare.com/api/payments/webhook
```

Notas:
- La URL de `trycloudflare` cambia cada vez que reinicias el tunel.
- Mantene la terminal del tunel abierta mientras haces las pruebas.
- No uses una URL fija de ejemplo en produccion.

Para la evaluacion:
- Voy a exponer publicamente el endpoint `POST /api/payments/webhook` con Cloudflare Tunnel.
- Durante la ventana de evaluacion voy a mantener la API y el tunel activos.
- La URL publica vigente de `trycloudflare` se comparte al evaluador al inicio de la prueba.
- Esa URL se va a mantener encendida hasta finalizar la evaluacion (si debo reiniciar el tunel, comparto inmediatamente la nueva URL).
- El endpoint de webhook a compartir siempre tiene este formato: `https://<tu-subdominio>.trycloudflare.com/api/payments/webhook`.

**1. Crear pago**

```bash
curl --request POST \
  --url http://localhost:3009/api/payments \
  --header 'Content-Type: application/json' \
  --header 'User-Agent: insomnia/12.5.0' \
  --data '{
    "importe": 1,
    "fecha_vto": "2026-05-08",
    "recargo": 123457,
    "fecha_2do_vto": "2026-05-10",
    "descripcion": "Prueba de Pago",
    "referencia_externa": "TEST",
    "referencia_externa_2": "TEST",
    "url_redirect": "https://www.helipagos.com",
    "webhook": "https://matters-issues-penguin-anti.trycloudflare.com/api/payments/webhook",
    "qr": true
}'
```

**2. Consultar pago** (`:id` = clave primaria local en `payments`, no el `id_sp`)

```bash
curl --request GET \
  --url "$BASE/api/payments/1" \
  --header 'User-Agent: insomnia/12.5.0'
```

Cuerpo exitoso: `local` (registro BD), `helipagos` (objeto normalizado si Helipagos devuelve array con datos u objeto; `null` si responde `[]`), `estadoHelipagos` (prioriza `estado_pago`, si no `estado` del remoto).

**3. Webhook**
 ⚠️ Importante:

 Antes de ejecutar este request, asegurate de reemplazar:

 ```txt
 <tu_webhook_secret>
 ```

 por el mismo valor configurado en tu archivo `.env` dentro de:

 ```env
 WEBHOOK_SECRET=tu_valor
 ```

 Si `WEBHOOK_SECRET` no está configurado en el .env, podés omitir el header:

 ```bash
 -H "X-Webhook-Secret: <tu_webhook_secret>"
 ```

```bash
curl -s -X POST "$BASE/api/payments/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: <tu_webhook_secret>" \
  -d "{\"id_sp\":123456,\"estado\":\"PROCESADA\",\"referencia_externa\":\"REF-UNICA-001\",\"medio_pago\":\"Visa\",\"importe_abonado\":\"20\",\"fecha_importe\":\"2026-05-08 10:00:00\"}"
```

- Sin fila para ese `id_sp`: **200** `{ "acknowledged": true }` y log de advertencia.
- Pago ya `PROCESADA`: **200** `{ "acknowledged": true, "alreadyProcessed": true }`.
- Actualizacion correcta: **200** con `message`: *Estado en BD actualizado a PROCESADA*.

**4. Cancelar pago** (`PUT`; `:id` = PK local, igual que en `GET`)

```bash
curl --request PUT \
  --url http://localhost:3009/api/payments/1 \
  --header 'User-Agent: insomnia/12.5.0'
```

- Si existe y estado local es `GENERADA` o `RECHAZADA`: **200** con `message`: *Pago cancelado correctamente* y estado local `CANCELADA`.
- Si no existe: **404** (*Pago no encontrado*).
- Si el estado no permite cancelacion: **409**.

### Variables de entorno relacionadas

Ademas de las credenciales de PostgreSQL, para este flujo necesitas:

| Variable | Uso |
|----------|-----|
| `URL_TEST` o `URL_PRODUCTION` | Host de Helipagos (sandbox o produccion) sin slash final |
| `URL_PREFIX` | Segmento de path que precede al recurso (ej. `api` => base `https://sandbox.../api`) |
| `TOKEN_SECRET` | Se envia como `Authorization: Bearer ...` en la llamada a Helipagos |
| `ENCRYPTION_SECRET` | Cifrado de `codigo_barra` y `qr_data` al persistir (debe cumplir la politica fuerte definida en codigo) |
| `helipagos.config` | Incluye `timeout` (ms) para la peticion HTTP a Helipagos |

#### Guia rapida del `.env` (que hace cada variable y como evitar fallos)

## Configurar variables de entorno

Partí del archivo de ejemplo `.env.example` y creá tu archivo `.env`:

### Linux / macOS

```bash
cp .env.example .env
```

### Windows (PowerShell)

```powershell
copy .env.example .env
```

Luego abrí el archivo `.env` y reemplazá los valores de ejemplo por los reales.

Ejemplo:

```env
WEBHOOK_SECRET=mi_secreto_real
TOKEN_SECRET=otro_secreto
NODE_ENV=development
```

> ⚠️ Importante:
>
> Valores como:
>
> ```env
> your_webhook_secret
> your_token_secret
> your_test_url
> ```
>
> son solamente placeholders de ejemplo y deben ser reemplazados todos los campos.

Bloques y variables clave:

- **API Nest**
  - `PORT`: puerto HTTP de tu API (ej. `3009`).
  - `USE_DOCKER`: `true` cuando la API corre dentro de Docker Compose; `false` en local.

- **Conexion de Nest a PostgreSQL**
  - `DB_HOST`: host usado con `USE_DOCKER=false` (ej. `localhost`).
  - `DB_HOST_DOCKER`: host usado con `USE_DOCKER=true` (en compose suele ser `postgres`).
  - `DB_PORT`: puerto de PostgreSQL (usualmente `5432`).
  - `DB_USER`, `DB_PASSWORD`, `DB_NAME`: credenciales/base que usa TypeORM.

- **Inicializacion del contenedor Postgres (docker)**
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: usuario/password/base inicial del contenedor.
  - `POSTGRES_HOST_AUTH_METHOD`: en esta demo se usa `trust` para simplificar pruebas.

- **pgAdmin (solo interfaz web)**
  - `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`: login de pgAdmin.

- **Integracion Helipagos**
  - `PRODUCTION`: `true` usa `URL_PRODUCTION`; `false` usa `URL_TEST`.
  - `URL_TEST`, `URL_PRODUCTION`: base URL Helipagos (sin slash final).
  - `URL_PREFIX`: prefijo de Helipagos (en homologacion suele ser `api`).
  - `TOKEN_SECRET`: token Bearer enviado en `Authorization`.
  - `WEBHOOK_SECRET`: secreto para validar `X-Webhook-Secret` en `POST /api/payments/webhook` (si esta definido en `.env`, el header pasa a ser obligatorio).

- **Seguridad local**
  - `ENCRYPTION_SECRET`: clave para cifrar `codigo_barra` y `qr_data` antes de guardar en BD.

Errores comunes por `.env` mal configurado:

- **`Helipagos no disponible temporalmente` (503)**: `URL_TEST/URL_PRODUCTION` incorrecta, `URL_PREFIX` incorrecto, timeout bajo, o red caida.
- **401/403 Helipagos**: `TOKEN_SECRET` invalido o vencido.
- **Error de conexion a DB**: combinacion incorrecta de `USE_DOCKER` con `DB_HOST`/`DB_HOST_DOCKER`, o credenciales DB invalidas.
- **Error de cifrado al crear pago**: `ENCRYPTION_SECRET` ausente o no valida para la politica definida en `src/config/encryption/encript.ts`.

Las rutas mock de Helipagos usadas por este servicio son:

- `POST {URL_TEST|URL_PRODUCTION}/{URL_PREFIX}/solicitud_pago/v1/checkout/solicitud_pago` (crear)
- `POST {URL_TEST|URL_PRODUCTION}/{URL_PREFIX}/solicitud_pago/v1/get_solicitud_pago?id={id_sp}` (consultar)
- `PUT {URL_TEST|URL_PRODUCTION}/{URL_PREFIX}/solicitud_pago/v1/checkout/cancelacion_solicitud_pago?id={id_sp}` (cancelar)

### Cuerpo de la peticion (JSON)

Campos validados con `class-validator` (`CreatePaymentDto`):

| Campo | Tipo | Notas |
|-------|------|--------|
| `importe` | number entero | >= 1 |
| `fecha_vto` | string | ISO fecha `YYYY-MM-DD` |
| `recargo` | number entero | >= 1 |
| `fecha_2do_vto` | string | ISO fecha `YYYY-MM-DD`, debe ser posterior a `fecha_vto` (regla de negocio) |
| `descripcion` | string | 1..255 caracteres |
| `referencia_externa` | string | 1..255, unica en base local |
| `referencia_externa_2` | string | 1..255 |
| `url_redirect` | string | 1..255 |
| `webhook` | string | 1..255, URL de notificacion; se guarda junto al pago |
| `qr` | boolean | En JSON debe ir sin comillas: `true` o `false` (no `"true"` / `"false"` como string). |

No se admiten propiedades extra (`forbidNonWhitelisted` en `ValidationPipe`).

### Respuesta exitosa

Cuerpo tipico devuelto por el servicio tras crear y persistir el pago:

```json
{
  "message": "Pago creado correctamente",
  "data": {
    "id_sp": 123456,
    "checkout_url": "https://...",
    "estado": "GENERADA"
  }
}
```

Los datos sensibles que devuelve Helipagos (`codigo_barra`, `qr_data`) se almacenan cifrados en PostgreSQL; la respuesta HTTP de tu API no los incluye en este formato.

> Resumen de codigos: ver tabla **Formato de errores (NestJS)** mas arriba. El `POST /api/payments` responde **201** al crear (`@HttpCode(HttpStatus.CREATED)`).

### Webhook de pago (`POST /api/payments/webhook`)

| Aspecto | Comportamiento |
|--------|----------------|
| Codigo HTTP exitoso | **200** (`@HttpCode(HttpStatus.OK)` en `payments.controller.ts`) |
| `id_sp` sin fila en BD | **200** con cuerpo `{ "acknowledged": true }`; **no** se responde 404 para no inducir reintentos agresivos del notificador. Se registra un **warning** en log (`PaymentsService`) con `id_sp`, `referencia_externa` y `estado` para investigacion. |
| Payload valido (`estado === PROCESADA` y pago encontrado) | Se actualiza la fila vía `save` en el repositorio y se devuelve mensaje de actualizacion. |
| Pago ya estaba `PROCESADA` (idempotencia / reintentos) | **200** con `{ "acknowledged": true, "alreadyProcessed": true }` sin volver a escribir; evita **409** en stress de muchas entregas del mismo evento. |
| Validacion / estado invalido | Puede responder **400** (DTO) o **409** si `estado` no es `PROCESADA` (no es el escenario 10). |

### Estrategia ante concurrencia (escenarios 10 y 11)

- **Varios webhooks para distintos `id_sp`:** cada request modifica una fila distinta; PostgreSQL aplica bloqueo a nivel **fila**; TypeORM `save` emite `UPDATE` por PK. No hay contencion cruzada entre pagos distintos mas alla del pool de conexiones.
- **Varios webhooks concurrentes para el mismo `id_sp`:** Postgres serializa `UPDATE` sobre la misma fila. Con **payloads identicos** (mismo `PROCESADA` y mismos campos), el estado final es coherente e **idempotente**. Si dos payloads **difieren** en campos opcionales y llegan muy pegados, puede predominar el ultimo `save` (comportamiento habitual sin `SELECT FOR UPDATE`; aceptable si el proveedor envia el mismo cuerpo en reintentos).
- **Deadlocks:** con un unico `UPDATE` por transaccion y una sola fila por `id_sp`, el patron de bloqueo es lineal; riesgo de deadlock entre estos webhooks es **muy bajo**. Apareceria mas si hubiera otras rutas que bloquearan las mismas filas en **orden distinto** (no es el caso del flujo actual).
- **Stress 50-60 concurrentes:** Nest atiende requests en paralelo; la base serializa por fila. **Herramienta usada para validar:** [autocannon](https://github.com/mcollina/autocannon) (benchmark HTTP). Ejemplo (ajusta `PORT`, `id_sp` y cuerpo a un pago `GENERADA` existente en BD):

```bash
npx autocannon -m POST -H "Content-Type: application/json" \
  -b "{\"id_sp\":706047,\"estado\":\"PROCESADA\",\"referencia_externa\":\"TEST3\"}" \
  -c 60 -d 5 http://localhost:3009/api/payments/webhook
```

Interpretacion: `-c 60` es hasta 60 conexiones concurrentes; `-d 5` duracion en segundos. Revisar que todos los codigos sean **2xx** (en especial **200**), la fila en BD quede `PROCESADA` una sola vez sin valores incoherentes, y los logs sin errores. Alternativa establecida: **Apache Bench** (`ab -n 200 -c 60 -p body.json -T application/json ...`).

- Ajustar pool de TypeORM si el entorno limita conexiones.

#### Evidencia de ejecucion (completar antes de entregar)

Corrida realizada para dejar trazabilidad al evaluador:

```text
Fecha/hora: 2026-05-08 09:59 (UTC-3)
Ambiente (local/docker + URL webhook publico): Local/Docker, http://localhost:3009/api/payments/webhook
Herramienta: autocannon
Comando usado: npx autocannon -m POST -H "Content-Type: application/json" -i body.json -c 60 -d 5 http://localhost:3009/api/payments/webhook
Total requests: 11k requests en 5.03s (aprox.)
2xx: sin registros de non-2xx en la salida de la corrida (corrida limpia)
4xx: 0
5xx: 0
Errores de red/timeouts: 0
Estado final en BD del id_sp probado: PROCESADA
Observaciones: prueba concurrente con 60 conexiones durante 5 segundos, latencia promedio 25.77 ms y rendimiento promedio de 2280.81 req/s, sin errores reportados por autocannon.
```

### Como validar manualmente el escenario 503 (Helipagos caido / timeout)

1. **Timeout:** reduce temporalmente `timeout` en `src/config/helipagos.config.ts` (por ejemplo `1` ms), reinicia la app y reenvia el POST; debe responder **503** sin crear fila inconsistente si Helipagos no respondio OK.
2. **DNS / red:** usa temporalmente en `.env` un `URL_TEST` con dominio inexistente; debe clasificarse como error de red y mapear a **503** con el mensaje configurado.
3. Restaura siempre `timeout` y URL correctos despues de la prueba.

## Docker (Nest + PostgreSQL + pgAdmin)

La app usa un unico archivo `.env` y la variable `USE_DOCKER` para decidir el host de base:

- `USE_DOCKER=false` => usa `DB_HOST` (local/localhost)
- `USE_DOCKER=true` => usa `DB_HOST_DOCKER` (contenedor `postgres`)

`docker-compose` fuerza `USE_DOCKER=true` en el servicio `app`.

### Inicializacion de la base de datos

- **Con Docker:** al arrancar el servicio `postgres`, las variables `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` del `.env` crean usuario y base inicial; no hace falta un `CREATE DATABASE` manual para esta demo.
- **Esquema y tablas:** la primera vez que Nest se conecta con `PRODUCTION !== 'true'`, TypeORM **sincroniza** el esquema desde `payment.entity.ts` y el resto de entities cargadas (`synchronize` en `src/app.module.ts`). No se incluye un `init.sql` separado: el modelo vivo es el codigo.
- **Solo PostgreSQL vacio:** basta con que exista la base configurada en `DB_NAME` (en compose suele coincidir con `POSTGRES_DB`); las tablas aparecen al iniciar la API.

1) Crear archivo de entorno desde el ejemplo:

```bash
cp .env.example .env
```

2) Configurar tus credenciales en `.env`:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST_AUTH_METHOD` (en esta demo: `trust`)
- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_DEFAULT_PASSWORD`

3) Levantar contenedores:

```bash
docker compose up --build
```

Servicios disponibles:

- API Nest: `http://localhost:3009`
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

Para simplificar la prueba tecnica, PostgreSQL corre con `POSTGRES_HOST_AUTH_METHOD=trust` en Docker, por lo que pgAdmin puede conectar sin pedir password del server.

pgAdmin corre con `PGADMIN_CONFIG_SERVER_MODE=False`, por lo que funciona en modo single-user y evita el login web en cada inicio.

Nota: el proyecto incluye `pgadmin-servers.json` y un script de inicializacion, por lo que el servidor `helipagos` se importa automaticamente al iniciar el contenedor.

Comandos utiles de Docker (que hace cada uno):

```bash
# Levanta todo el stack y reconstruye imagenes (primera ejecucion o cambios de Dockerfile)
docker compose up --build

# Ver contenedores del stack
docker compose ps

# Ver logs
docker compose logs -f

# Detener y eliminar contenedores/red (conserva volumenes)
docker compose down

# Detener y eliminar contenedores + volumenes (reset total)
docker compose down -v

# Detener solo el contenedor de pgAdmin (sin borrar nada)
docker compose stop pgadmin

# Eliminar solo contenedor de pgAdmin
docker compose rm -f pgadmin

# Volver a levantar solo pgAdmin en segundo plano
docker compose up -d pgadmin

# Eliminar el volumen de pgAdmin (borra configuraciones/sesion guardada de pgAdmin)
docker volume rm helipagos_pgadmin_data

# Reiniciar solo pgAdmin
docker compose restart pgadmin
```

## Implementacion paso a paso

1. Se inicio el proyecto desde cero en NestJS y se definio la base de configuracion por variables de entorno en `.env`.
2. Se configuro `TypeOrmModule.forRootAsync` en `src/app.module.ts` para conectar a PostgreSQL usando `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.
3. Se ajusto `src/main.ts` para escuchar en `0.0.0.0`, permitiendo acceso a la API cuando Nest corre dentro de Docker.
4. Se creo `Dockerfile` para la API Nest con entorno Node, instalacion de dependencias y arranque en modo desarrollo (`npm run start:dev`).
5. Se creo `.dockerignore` para evitar copiar archivos innecesarios al contexto de build (por ejemplo `node_modules`, `dist`, `.git`).
6. Se creo `docker-compose.yml` con tres servicios: `app` (Nest), `postgres` (base de datos) y `pgadmin` (administracion de DB).
7. Se definio persistencia con volumenes Docker (`postgres_data` y `pgadmin_data`) para conservar datos entre reinicios.
8. Se unifico la configuracion en un solo `.env` y se agrego la variable `USE_DOCKER` para distinguir ejecucion local y ejecucion en contenedor.
9. Se agrego `DB_HOST_DOCKER=postgres` en `.env` y se implemento la logica para que Nest use ese host cuando `USE_DOCKER=true`.
10. Se configuro `docker-compose.yml` para forzar `USE_DOCKER=true` en el servicio `app`, manteniendo `USE_DOCKER=false` para ejecucion local por defecto.
11. Se creo `pgadmin-servers.json` con la conexion `helipagos` predefinida para evitar la creacion manual del servidor en pgAdmin.
12. Se monto `pgadmin-servers.json` dentro del contenedor (`/pgadmin4/servers.json`) y se agrego script de inicializacion `docker/pgadmin/init-pgadmin.sh`.
13. Se ajusto el script de inicializacion para esperar la DB interna de pgAdmin y ejecutar la importacion automatica con el comando correcto de `setup.py`.
14. Se resolvieron incompatibilidades detectadas en ejecucion (email invalido, formato de import y atributos requeridos en `servers.json`).
15. Se habilito `PGADMIN_CONFIG_SERVER_MODE=False` y `PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED=False` para simplificar el acceso durante la prueba tecnica.
16. Se habilito `POSTGRES_HOST_AUTH_METHOD=trust` en Docker para evitar prompt de password al conectar desde pgAdmin en entorno de demo.
17. Se valido que Nest compile correctamente (`npm run build`) y que el stack levante con `docker compose up --build`.
18. Se dejo la documentacion actualizada para que una persona evaluadora pueda ejecutar el sistema con el menor numero de pasos manuales posible.

## Ejecutar pruebas

```bash
# pruebas unitarias
$ npm run test

# pruebas e2e
$ npm run test:e2e

# cobertura de pruebas
$ npm run test:cov
```

## Roadmap

Mejoras posibles sobre la base actual (no bloquean la demo; sirven para evolucionar el servicio):

1. **Webhook:** validar origen del evento (firma, `WEBHOOK_SECRET`, IP allowlist) antes de persistir cambios.
2. **Pruebas:** ampliar e2e en `test/` para flujo crear → consultar → webhook → cancelar, con mocks de Helipagos.
3. **Base de datos:** migraciones TypeORM versionadas para entornos compartidos y despliegues repetibles.
4. **Observabilidad:** health checks (`/health`), correlacion de `id_sp` en logs estructurados, metricas opcionales.
5. **Resiliencia:** reintentos con backoff selectivo en llamadas a Helipagos donde el contrato lo permita; afinar pool de conexiones bajo carga.

## Licencia

Nest tiene licencia [MIT](https://github.com/nestjs/nest/blob/master/LICENSE).
