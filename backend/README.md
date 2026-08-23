# IchiHub API

This is a dependency-free Node.js API foundation for the IchiHub frontend. It supports one synchronized marketplace: accounts, vendor profiles and verification, availability, bookings and valid status transitions, live location events, payments, reviews, complaints, notifications, audit records, and live analytics.

## Run locally

1. Copy `.env.example` to `.env` and set a long, unique `TOKEN_SECRET`.
2. From this `backend` directory run `npm start` (or `npm run dev` during development).
3. The API starts at `http://127.0.0.1:4000`; `GET /health` confirms it is available.

Copy `frontend/.env.example` to `frontend/.env` when the API is not running on the default local address.

No package installation is needed. Its JSON data file is created at `backend/data/ichihub.json` on first startup and is intentionally ignored by Git. This is suitable for local development only; use a managed database and a real secret manager before deployment.

## API surface

| Area | Routes |
| --- | --- |
| Authentication & live updates | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `GET /events?token=...` |
| Vendors | `GET /vendors`, `GET /vendors/:id`, `PATCH /vendors/me`, verification and availability endpoints under `/vendors/me` |
| Bookings | `GET /bookings`, `POST /bookings`, booking detail/status/location/review endpoints |
| Support | `POST /complaints`, complaint detail, status, and messages |
| Admin | Metrics, analytics, audit log, verification centre, and service category management under `/admin` |

Protected calls use `Authorization: Bearer <token>`. Registration accepts `customer` and `vendor` roles. Public admin registration is deliberately not exposed; provision the first super administrator with the bootstrap environment values, then remove the password from the runtime environment. Events are Server-Sent Events and are scoped to the current user (administrators receive operational events).

## Frontend contract

The API uses camelCase fields: `vendorId`, `customerId`, `bookingLat`, and `vendorLiveLocation`. Identity document requests retain only a non-sensitive document reference and the final four digits; document bytes must be placed in private object storage by a future upload service and never returned by public vendor endpoints.
