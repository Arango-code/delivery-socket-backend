# Backend de eventos para entregas

[English](README.md) | Español

Backend con Express, Socket.IO, TypeScript y PostgreSQL para gestionar entregas de varios restaurantes. Una automatización de confianza envía un pedido; el personal del restaurante recibe actualizaciones en tiempo real, establece el costo de entrega y el cliente confirma o cancela mediante un token específico del pedido.

El proyecto incluye una migración inicial de la base de datos, datos de demostración, pruebas automatizadas y una demostración completa que se puede ejecutar localmente. Todos los nombres y direcciones de ejemplo son ficticios.

## Requisitos

- Node.js 22.12+ y npm
- PostgreSQL 16+ (o Docker Compose)

## Ejecutarlo localmente

Estas instrucciones requieren una **base de datos nueva y desechable**. Nunca ejecutes la carga de datos de demostración ni `db:push` sobre una base de datos empresarial existente.

1. Copia `.env.example` como `.env` (`cp .env.example .env` en macOS/Linux o `Copy-Item .env.example .env` en PowerShell). Las contraseñas y claves de ejemplo son **solo para uso local**. Cambia `JWT_SECRET`, `WEBHOOK_API_KEY` y `DEMO_PASSWORD` antes de desplegar el proyecto en un entorno compartido.
2. Inicia PostgreSQL con `docker compose up -d db`. Si no tienes Docker, crea una base de datos PostgreSQL vacía y configura `DATABASE_URL` en `.env`.
3. Ejecuta estos comandos en orden:

```sh
npm ci
npm run db:migrate
npm run build
npm run db:seed
npm test
npm start
```

4. En otra terminal, ejecuta `npm run demo`. El script inicia sesión con usuarios de dos restaurantes, crea un pedido a través del webhook, recibe un evento de Socket.IO, comprueba el aislamiento entre restaurantes por HTTP y sockets, establece el costo de entrega y confirma el pedido. Al terminar muestra un mensaje de éxito o sale con un error.

Por defecto, la API escucha en `http://localhost:4000`. `GET /health` solo comprueba que el proceso esté activo; `npm run demo` verifica el flujo que utiliza la base de datos.

## API y límites de confianza

| Acción | Ruta / evento | Autenticación |
| --- | --- | --- |
| Inicio de sesión del personal | `POST /api/auth/login` | Usuario y contraseña |
| Crear pedido | `POST /api/orders` | Cabecera `x-webhook-key`; solo entre servidores |
| Listar o consultar pedidos | `GET /api/orders`, `GET /api/orders/:id` | JWT del personal; limitado a su restaurante |
| Establecer costo de entrega | `PUT /api/orders/:id/delivery-fee` | JWT del personal; restaurante propietario |
| Confirmar o cancelar | `PUT /api/orders/:id/confirm` | `confirmation_token` específico del pedido |
| Actualizaciones en tiempo real | Eventos Socket.IO `order:new`, `order:updated`, `order:confirmed`, `order:cancelled` | JWT del personal en `auth.token` |
| Suscribirse a un pedido | Evento Socket.IO `join:order` | JWT del personal; restaurante propietario o administrador |

La carga de datos de demostración crea `demo_north`, `demo_south` y `demo_admin`, todos con la contraseña `DEMO_PASSWORD` definida en `.env`. El cliente no se conecta a Socket.IO: la automatización de confianza recibe `confirmation_token` al crear el pedido y debe enviárselo al cliente correcto mediante un canal seguro bajo su control. No expongas `WEBHOOK_API_KEY` en el navegador ni incluyas tokens de confirmación en los registros.

Ejemplo de cuerpo para el webhook (utiliza los identificadores que muestra `npm run db:seed`):

```json
{
  "external_id": "identificador-unico-de-la-automatizacion",
  "restaurant_id": 1,
  "client_id": 1,
  "order_items": [{ "product_id": 1, "quantity": 2 }]
}
```

`external_id` es único: si la integración reintenta el mismo evento, la API devuelve el pedido original en lugar de crear un duplicado. El servidor busca cada producto dentro del restaurante indicado y calcula los precios y el total. El webhook no puede imponer precios ni el estado inicial del pedido.

## Decisiones de diseño

- REST y Socket.IO autentican al personal consultando su registro actual en la base de datos. Una cuenta desactivada o reasignada a otro restaurante deja de funcionar en nuevas solicitudes o conexiones.
- Antes de permitir la suscripción a la sala de un pedido, se comprueba a qué restaurante pertenece. Otro restaurante no puede suscribirse adivinando el identificador del pedido.
- Los cambios de estado utilizan actualizaciones condicionales en la base de datos para rechazar transiciones simultáneas incompatibles. La confirmación del cliente utiliza un token firmado y específico del pedido, no un identificador de sesión sin protección.
- Los importes utilizan `Decimal(12,2)` en PostgreSQL y se calculan en el servidor.
- Git ignora `.env` y el código generado por Prisma. Los datos de demostración son ficticios.

Este es un backend de demostración para portafolio, no una plantilla lista para producción. Antes de usarlo en producción, añade limitación de solicitudes, monitoreo operativo, HTTPS, rotación de secretos y un plan de copias de seguridad y recuperación adaptado al despliegue. Siempre que sea posible, restringe además el acceso al webhook público a infraestructura de confianza.
