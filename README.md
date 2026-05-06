<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">Un framework progresivo de <a href="http://nodejs.org" target="_blank">Node.js</a> para crear aplicaciones de servidor eficientes y escalables.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descripcion

Repositorio base en TypeScript del framework [Nest](https://github.com/nestjs/nest).

## Configuracion del proyecto

```bash
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

## Docker (Nest + PostgreSQL + pgAdmin)

La app usa un unico archivo `.env` y la variable `USE_DOCKER` para decidir el host de base:

- `USE_DOCKER=false` => usa `DB_HOST` (local/localhost)
- `USE_DOCKER=true` => usa `DB_HOST_DOCKER` (contenedor `postgres`)

`docker-compose` fuerza `USE_DOCKER=true` en el servicio `app`.

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

## Despliegue

Cuando estes listo para desplegar tu aplicacion NestJS en produccion, hay pasos clave que podes aplicar para asegurar un funcionamiento eficiente. Revisa la [documentacion de despliegue](https://docs.nestjs.com/deployment) para mas informacion.

Si buscas una plataforma en la nube para desplegar tu aplicacion NestJS, revisa [Mau](https://mau.nestjs.com), la plataforma oficial para desplegar aplicaciones NestJS en AWS. Mau simplifica el despliegue y lo hace rapido con pocos pasos:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

Con Mau, podes desplegar tu aplicacion en pocos clics y enfocarte en desarrollar funcionalidades en lugar de administrar infraestructura.

## Recursos

Estos recursos pueden resultarte utiles al trabajar con NestJS:

- Visita la [Documentacion de NestJS](https://docs.nestjs.com) para aprender mas sobre el framework.
- Para preguntas y soporte, visita el [canal de Discord](https://discord.gg/G7Qnnhy).
- Para profundizar y practicar, revisa los [cursos en video oficiales](https://courses.nestjs.com/).
- Despliega tu aplicacion en AWS con [NestJS Mau](https://mau.nestjs.com) en pocos clics.
- Visualiza el grafo de tu aplicacion e interactua en tiempo real con [NestJS Devtools](https://devtools.nestjs.com).
- Si necesitas ayuda para tu proyecto (part-time o full-time), revisa el [soporte enterprise](https://enterprise.nestjs.com).
- Para novedades, segui a Nest en [X](https://x.com/nestframework) y [LinkedIn](https://linkedin.com/company/nestjs).
- Si buscas trabajo o queres publicar una vacante, visita el [Jobs board](https://jobs.nestjs.com).

## Soporte

Nest es un proyecto open source con licencia MIT. Crece gracias a patrocinadores y a la comunidad que lo apoya. Si queres sumarte, [lee mas aqui](https://docs.nestjs.com/support).

## Contacto

- Autor - [Kamil Mysliwiec](https://twitter.com/kammysliwiec)
- Sitio web - [https://nestjs.com](https://nestjs.com/)
- X/Twitter - [@nestframework](https://twitter.com/nestframework)

## Licencia

Nest tiene licencia [MIT](https://github.com/nestjs/nest/blob/master/LICENSE).
