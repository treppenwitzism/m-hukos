# Contributing

How we work together on this repository.

## Branches

- `main` always holds working code. Nobody pushes to it directly.
- Create a branch for each piece of work, named `type/short-description`:
  - `feature/menu-api`
  - `feature/cart-page`
  - `fix/price-rounding`
  - `docs/erd-update`

```bash
git checkout main
git pull
git checkout -b feature/menu-api
```

## Routine

1. `git pull` on `main` before starting new work.
2. Make small commits as you go.
3. Push your branch: `git push -u origin feature/menu-api`.
4. Open a pull request on GitHub into `main`.
5. A teammate reviews and approves it, then it is merged.
6. Delete the branch after merging.

## Commit messages

Short, present tense, say what changed:

- `Add menu list endpoint`
- `Fix points balance going negative`

## Rules that prevent most problems

- **Never commit `.env` or any secret** (database password, JWT secret, PayMongo keys). Only `.env.example` is committed, with blank values.
- **Do not commit `node_modules/`.** It is already in `.gitignore`.
- **Schema changes go through `database/`.** If you change a table, add a numbered file in `database/migrations/` (for example `001_add_phone_to_users.sql`) and update `database/schema.sql` in the same pull request, so everyone's database stays in sync.
- **One person generates the Angular project**, and everyone else pulls it. Generating it twice causes painful merge conflicts.
- Tell the group before editing a file someone else is actively working on.

## Areas

| Area | Folders |
|---|---|
| Auth, users, roles | `backend/src/*` auth files, `frontend/.../core`, login pages |
| Menu and admin menu | menu routes and services, `features/menu`, `features/admin` |
| Orders, payments, QR | order and payment services, `features/cart`, `features/orders`, `features/staff` |
| Points and reviews | points service, review routes, `features/account`, `features/reviews` |

## Merge conflicts

If GitHub says your branch has conflicts, update it from `main`:

```bash
git checkout main
git pull
git checkout feature/your-branch
git merge main
```

Fix the marked files, then `git add` and `git commit`. Ask for help rather than guessing.
