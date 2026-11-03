import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/screen-title";
import { ExpensesPage } from "@/components/pages/expenses-page";

export default function Page() {
  return <div className="w-full max-w-page mx-auto flex flex-col flex-1 items-center justify-start"><Suspense fallback={<PageSkeleton />}><ExpensesPage /></Suspense></div>;
}
