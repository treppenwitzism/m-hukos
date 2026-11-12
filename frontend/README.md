# Frontend (Angular)

This folder is intentionally empty for now. One person on the team generates the Angular project once, commits it, and everyone else pulls it. Do not each generate your own.

From the repository root:

```bash
npm install -g @angular/cli
ng new restaurant-frontend --directory frontend --routing --style=scss --skip-git
```

If `ng new` complains that the folder is not empty, delete this README first, run the command, then add the README back.

Planned feature areas (one folder each under `src/app/`):

- `core/` services, guards, interceptors (auth, API client)
- `shared/` reusable components (buttons, star rating, QR display)
- `features/menu/` menu browsing
- `features/cart/` cart and order review
- `features/orders/` order history and QR page
- `features/account/` profile, points
- `features/reviews/` review forms and lists
- `features/admin/` menu, prices, availability, reviews, users
- `features/staff/` QR scan and order verification
