'use client';

import { useEffect, useState } from 'react';
import { CreditCard, IndianRupee, LineChart, TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardCard } from '../../../components/DashboardCards/dashboard-card';
import { LineChartComponent, PieChartComponent } from '../../../components/DashboardCharts/dashboard-chart';

interface BreakdownRow {
  date: string;
  amountInvested: number;
  navAtPurchase: number;
  unitsPurchased: number;
  currentValue: number;
  profitLoss: number;
}

interface InvestmentData {
  totalInvested: number;
  totalUnits: number;
  currentNav: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  totalPayments: number;
  chartData: { name: string; value: number }[];
  pieData: { name: string; value: number; color: string }[];
  breakdown: BreakdownRow[];
}

function fmt(val: number) {
  return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function EmployeeDashboard() {
  const [data, setData] = useState<InvestmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/investments')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-lg">
        Loading dashboard...
      </div>
    );
  }

  const isProfit = !data || data.profitLoss >= 0;

  return (
    <>
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Invested"
          value={data ? fmt(data.totalInvested) : '₹0'}
          icon={IndianRupee}
          description={`${data?.totalPayments ?? 0} payment(s) made`}
        />
        <DashboardCard
          title="Current Value"
          value={data ? fmt(data.currentValue) : '₹0'}
          icon={CreditCard}
          description={data ? `Latest NAV: ₹${data.currentNav}` : 'No data'}
        />
        <DashboardCard
          title={isProfit ? 'Total Profit' : 'Total Loss'}
          value={data ? fmt(Math.abs(data.profitLoss)) : '₹0'}
          icon={isProfit ? TrendingUp : TrendingDown}
          description={
            data
              ? `${data.profitLossPercent.toFixed(2)}% ${isProfit ? 'gain' : 'loss'}`
              : '0%'
          }
        />
        <DashboardCard
          title="Total Units"
          value={data ? String(data.totalUnits) : '0'}
          icon={LineChart}
          description="Units allocated to your account"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-5 mt-8">
        <LineChartComponent data={data?.chartData} />
        <PieChartComponent data={data?.pieData} />
      </div>

      {/* Per-payment Breakdown Table */}
      {data && data.breakdown.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Investment Breakdown</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Invested</th>
                  <th className="px-4 py-3">NAV at Purchase</th>
                  <th className="px-4 py-3">Units</th>
                  <th className="px-4 py-3">Current Value</th>
                  <th className="px-4 py-3">Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.date}</td>
                    <td className="px-4 py-3">{fmt(row.amountInvested)}</td>
                    <td className="px-4 py-3">₹{row.navAtPurchase}</td>
                    <td className="px-4 py-3">{row.unitsPurchased}</td>
                    <td className="px-4 py-3">{fmt(row.currentValue)}</td>
                    <td className={`px-4 py-3 font-semibold ${row.profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {row.profitLoss >= 0 ? '+' : ''}{fmt(row.profitLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.breakdown.length === 0 && (
        <div className="mt-8 text-center text-gray-400 py-10 border rounded-xl">
          No investment records yet. Submit your first payment to see data here.
        </div>
      )}
    </>
  );
}
