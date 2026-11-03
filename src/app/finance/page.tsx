import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/screen-title";
import { FinancePage } from "@/components/pages/finance-page";
export default function Page() { return <Suspense fallback={<PageSkeleton />}><FinancePage /></Suspense>; }
