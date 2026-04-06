import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import CalendarDateRangePicker from "@/components/shared/custom-date-range-picker";
import CreditCards from "./components/my-wallet";
import Revenue from "./components/revenue";
import MonthlyExpenses from "./components/monthly-expenses";
import Summary from "./components/summary";
import Transactions from "./components/transactions";
import SavingGoal from "./components/saving-goal";
import KPICards from "./components/kpi-cards";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Finance Admin Dashboard",
    description:
      "A finance dashboard is an admin panel that visualizes key financial data such as income, expenses, cash flow, budget, and profit. Built with shadcn/ui, Tailwind CSS, Next.js.",
  };
}

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-page-title">Dashboard Financeiro</h1>
        <Suspense fallback={<Skeleton className="h-10 w-65" />}>
          <CalendarDateRangePicker />
        </Suspense>
      </div>

      <KPICards />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Revenue />
        <MonthlyExpenses />
        <Summary />
      </div>

      <div className="grid-cols-2 gap-4 space-y-4 lg:grid lg:space-y-0">
        <Transactions />
        <div className="space-y-4">
          <SavingGoal />
          <CreditCards />
        </div>
      </div>
    </div>
  );
}
