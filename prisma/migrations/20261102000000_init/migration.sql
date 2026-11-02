CREATE SCHEMA IF NOT EXISTS "pocket";

CREATE TABLE "pocket"."Pocket" (
  "id" CHAR(64) NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "mode" VARCHAR(7) NOT NULL DEFAULT 'weekly',
  "weeklyBudget" INTEGER NOT NULL DEFAULT 250000,
  "monthlyBudget" INTEGER NOT NULL DEFAULT 500000,
  "weekStartsOn" INTEGER NOT NULL DEFAULT 1,
  "bodyFont" VARCHAR(9) NOT NULL DEFAULT 'chai',
  "numberFont" VARCHAR(9) NOT NULL DEFAULT 'chai',
  "titleFont" VARCHAR(9) NOT NULL DEFAULT 'chai',
  "fontsChosen" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Pocket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Pocket_budgets_check" CHECK ("weeklyBudget" BETWEEN 1 AND 100000000 AND "monthlyBudget" BETWEEN 1 AND 100000000),
  CONSTRAINT "Pocket_weekStartsOn_check" CHECK ("weekStartsOn" BETWEEN 0 AND 6),
  CONSTRAINT "Pocket_mode_check" CHECK ("mode" IN ('weekly', 'monthly')),
  CONSTRAINT "Pocket_revision_check" CHECK ("revision" >= 0)
);

CREATE TABLE "pocket"."Expense" (
  "pocketId" CHAR(64) NOT NULL,
  "id" VARCHAR(100) NOT NULL,
  "amount" INTEGER NOT NULL,
  "category" VARCHAR(10) NOT NULL,
  "date" DATE NOT NULL,
  "memo" VARCHAR(80) NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("pocketId", "id"),
  CONSTRAINT "Expense_amount_check" CHECK ("amount" BETWEEN 1 AND 100000000),
  CONSTRAINT "Expense_category_check" CHECK ("category" IN ('식비', '카페', '교통', '쇼핑', '여가', '기타')),
  CONSTRAINT "Expense_pocketId_fkey" FOREIGN KEY ("pocketId") REFERENCES "pocket"."Pocket"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Expense_pocketId_date_idx" ON "pocket"."Expense"("pocketId", "date");

-- Keep these tables outside Supabase's public Data API schema.
REVOKE ALL ON SCHEMA "pocket" FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA "pocket" FROM PUBLIC;
