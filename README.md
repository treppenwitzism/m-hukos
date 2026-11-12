# M-HuKOS : Mr. Hungry Kitchen's Ordering System

A web app for Mr. Hungry Kitchen: menu browsing, online ordering and payment, advanced (scheduled) orders, QR-code order pickup, a points system, and customer reviews. Built as a finals project.

## Tech stack

| Layer | Technology |
|---|---|
| Front-end | Angular |
| Back-end | Node.js with Express (JavaScript) |
| Database | MySQL |
| Payments | PayMongo |

## Repository layout

```
m-hukos/
├── frontend/          Angular app (generated once, see frontend/README.md)
├── backend/           Express API
│   ├── src/
│   │   ├── config/        database and environment setup
│   │   ├── routes/        URL paths mapped to controllers
│   │   ├── controllers/   handle requests and responses
│   │   ├── services/      business logic (orders, points, payments)
│   │   ├── middleware/    auth, role checks, validation, errors
│   │   ├── models/        database queries per table
│   │   ├── jobs/          scheduled tasks (expire QR links)
│   │   └── utils/         small shared helpers
│   └── tests/
├── database/
│   ├── schema.sql         full MySQL schema (matches the ERD)
│   ├── migrations/        future schema changes, numbered
│   └── seeds/             sample data for development
├── docs/              proposal, diagrams, API notes
└── .github/           pull request template
```

## Installation

1. Clone the repo and install Node.js and MySQL.
2. Create the database: open MySQL and run `database/schema.sql`.
3. Back-end: `cd backend`, copy `.env.example` to `.env`, fill in your values, then `npm install` once dependencies are added.
4. Front-end: see `frontend/README.md`.

## Contributions

Read [CONTRIBUTING.md](CONTRIBUTING.md) before your first commit. In short: never push to `main`, work on a branch, and open a pull request for a teammate to review.
