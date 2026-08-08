# Production Deploy Runbook

## Migrations are no longer run during `build`

`npm run build` only runs `prisma generate && next build`. It does **not**
apply database migrations, and does not need database connectivity.

Migrations are an explicit, separate deploy step:

```sh
npm run db:migrate
```

(This runs `prisma migrate deploy` against whatever `POSTGRES_*` env vars are
set — point them at the target database, e.g. production, before running it.)

Ordinary deploys are just: deploy the build, then run `npm run db:migrate`
against the production database. The phased rollout below is a **one-time**
exception needed only for the Plan 2 (store tenancy) rollout, because it adds
a `storeId` column that goes from nullable to `NOT NULL` over pre-existing
rows.

## One-time Plan 2 production rollout

`prisma migrate deploy` applies every pending migration in one shot. This
branch has two tenancy migrations in sequence:

1. `add_store_and_nullable_store_id` — adds `storeId` as nullable.
2. `enforce_store_id_not_null` — makes `storeId` `NOT NULL` with no backfill.

If both are applied back-to-back on a database that still has pre-existing
rows (`storeId = NULL` on all of them), step 2 fails immediately. There must
be a window between the two migrations to backfill `storeId` on existing
rows via the adoption script. Do the rollout in this order, once:

1. **Ensure the store owner account exists in production:**

   ```sh
   npm run create-user -- <owner-email> <password> "<name>"
   ```

2. **Apply migrations up to and including `add_store_and_nullable_store_id`
   only** — not the `NOT NULL` migration. Do this by deploying/checking out
   the branch at commit `05e279f` (which contains the nullable `storeId`
   migration but not yet the non-null one) and running, against production:

   ```sh
   npm run db:migrate
   ```

   (`migrate deploy` applies all migrations pending in the deployed tree, so
   the non-null migration must not be present yet — that's why this step
   pins to `05e279f` rather than the tip of the branch.)

3. **Run the adoption script against production** — this creates tenant #1
   (the bookstore) and backfills every existing row's `storeId`:

   ```sh
   npm run adopt-store -- <owner-email>
   ```

4. **Deploy the full branch** and run `npm run db:migrate` again to apply
   `enforce_store_id_not_null`. This is now safe because every row has a
   `storeId` from step 3.

After this one-time rollout, future deploys just run `npm run db:migrate`
normally — no phased steps needed.

## Environment variables

Set in the production environment before deploying:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` = `https://store.thatsmy.app`
- `POSTGRES_*` (pointing at the production database)
