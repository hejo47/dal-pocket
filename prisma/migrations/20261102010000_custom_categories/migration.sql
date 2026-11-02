ALTER TABLE "pocket"."Pocket"
ADD COLUMN "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "pocket"."Expense"
DROP CONSTRAINT "Expense_category_check";

ALTER TABLE "pocket"."Expense"
ADD CONSTRAINT "Expense_category_check" CHECK (length("category") BETWEEN 1 AND 10);
