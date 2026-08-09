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

## One-time `money_to_minor_units` production rollout

The `money_to_minor_units` migration renames every money column from `*Nis`
to `*Minor` (data-preserving `RENAME COLUMN`, not drop/add) and then
multiplies every existing value by **100** to convert stored prices from
whole currency units to integer minor units. The rename is safe to replay,
but the `×100` value transform is **not idempotent** — running it twice on
the same rows would multiply prices by 10,000 instead of 100. Do this
rollout carefully, once:

1. **Back up production first:**

   ```sh
   pg_dump "$PRODUCTION_POSTGRES_URL_NON_POOLING" -Fc -f prod-backup-pre-money-minor.dump
   ```

2. **Rehearse on a real-data copy before touching production.** Restore the
   backup into a throwaway local Postgres 17 instance and run the migration
   there first:

   ```sh
   createdb money_minor_rehearsal
   pg_restore -d money_minor_rehearsal prod-backup-pre-money-minor.dump
   POSTGRES_PRISMA_URL=postgres://localhost/money_minor_rehearsal \
   POSTGRES_URL_NON_POOLING=postgres://localhost/money_minor_rehearsal \
     npm run db:migrate
   ```

   Verify against the rehearsal database:
   - Every money column (`priceMinor`, `totalMinor`, `discountMinor`,
     `unitPriceMinor`, `amountMinor`) is now exactly **100×** its
     pre-migration value (spot-check a sample of rows against the backup).
   - Order line items still reconcile: for a sample of orders,
     `sum(OrderItem.unitPriceMinor * quantity) + sum(OrderCollectionItem.unitPriceMinor * quantity)`
     relates to `Order.totalMinor` the same way it did before the migration
     (just scaled ×100), and `getAmountPayable(totalMinor, discountMinor)`
     still nets out correctly against summed `Transaction.amountMinor`
     (`REVENUE`) rows.
   - Drop the rehearsal database once satisfied
     (`dropdb money_minor_rehearsal`).

3. **Run the migration against production**, only after the rehearsal
   passes:

   ```sh
   npm run db:migrate
   ```

4. **Deploy the app build** that expects `*Minor` columns:

   ```sh
   vercel --prod
   ```

   Do not deploy the new app build before step 3 completes (it reads/writes
   `*Minor` columns that won't exist yet), and do not run `npm run db:migrate`
   a second time against production once `money_to_minor_units` has applied
   — the `×100` step must run exactly once against live data.

## Environment variables

Set in the production environment before deploying:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` = `https://store.thatsmy.app`
- `POSTGRES_*` (pointing at the production database)
