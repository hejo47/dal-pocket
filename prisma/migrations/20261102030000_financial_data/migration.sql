ALTER TABLE "pocket"."Pocket" ADD COLUMN "financialData" JSONB NOT NULL DEFAULT '{}';

UPDATE "pocket"."Pocket" SET "financialData" = jsonb_build_object(
  'months', jsonb_build_object(to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul', 'YYYY-MM'), jsonb_build_object('budget', "monthlyBudget", 'groceries', 0)),
  'openingBalance', 0, 'openingDate', '2000-01-01', 'billingDay', 15,
  'incomes', '[]'::jsonb, 'plans', '[]'::jsonb, 'installments', '[]'::jsonb, 'payments', '{}'::jsonb
);
