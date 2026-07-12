import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Phone, Expense } from '../types';

interface DashboardMetrics {
  totalProfit: number;
  grossRevenue: number;
  totalExpenses: number;
  inventoryValue: number;
  avgDaysToSell: number;
  agingStock: Array<{ model: string; buyDate: string; daysOld: number }>;
}

interface MonthlyProfit {
  month: string;
  profit: number;
}

interface Props {
  phones: Phone[];
  expenses: Expense[];
}

export default function Dashboard({ phones, expenses }: Props) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProfit: 0,
    grossRevenue: 0,
    totalExpenses: 0,
    inventoryValue: 0,
    avgDaysToSell: 0,
    agingStock: [],
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyProfit[]>([]);

  useEffect(() => {
    calculateMetrics();
  }, [phones, expenses]);

  const calculateMetrics = () => {
    // Total Profit = SUM(sellPrice - buyPrice - totalExpenses) for sold phones
    const soldPhones = phones.filter(p => p.status === 'Sold');
    
    let totalProfit = 0;
    let grossRevenue = 0;
    const profitByPhone: Record<string, number> = {};

    // Calculate expenses by phone
    expenses.forEach(exp => {
      profitByPhone[exp.phoneId] = (profitByPhone[exp.phoneId] || 0) + exp.amount;
    });

    soldPhones.forEach(phone => {
      const revenue = phone.sellPrice || 0;
      const cost = phone.buyPrice;
      const expenseForPhone = profitByPhone[phone.id] || 0;
      const profit = revenue - cost - expenseForPhone;
      totalProfit += profit;
      grossRevenue += revenue;
    });

    // Total Expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Inventory Value = SUM(buyPrice) for In Stock phones
    const inStockPhones = phones.filter(p => p.status === 'In Stock');
    const inventoryValue = inStockPhones.reduce((sum, p) => sum + p.buyPrice, 0);

    // Average Days to Sell
    const daysToSellList = soldPhones
      .filter(p => p.buyDate && p.sellDate)
      .map(p => {
        const buyDate = new Date(p.buyDate);
        const sellDate = new Date(p.sellDate!);
        return Math.floor((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
      });
    const avgDaysToSell = daysToSellList.length > 0 
      ? Math.round(daysToSellList.reduce((a, b) => a + b, 0) / daysToSellList.length)
      : 0;

    // Aging Stock (In Stock phones > 30 days old)
    const today = new Date();
    const agingStock = inStockPhones
      .filter(p => {
        const buyDate = new Date(p.buyDate);
        const daysOld = Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysOld > 30;
      })
      .map(p => {
        const buyDate = new Date(p.buyDate);
        const daysOld = Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
        return { model: p.model, buyDate: p.buyDate, daysOld };
      })
      .sort((a, b) => b.daysOld - a.daysOld);

    setMetrics({
      totalProfit,
      grossRevenue,
      totalExpenses,
      inventoryValue,
      avgDaysToSell,
      agingStock,
    });

    // Calculate monthly profit for last 6 months
    calculateMonthlyProfit(soldPhones, profitByPhone);
  };

  const calculateMonthlyProfit = (soldPhones: Phone[], profitByPhone: Record<string, number>) => {
    const monthlyProfitMap: Record<string, number> = {};
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toLocaleString('en-US', { year: 'numeric', month: 'short' });
      monthlyProfitMap[monthKey] = 0;
    }

    soldPhones.forEach(phone => {
      if (phone.sellDate) {
        const sellDate = new Date(phone.sellDate);
        const monthKey = sellDate.toLocaleString('en-US', { year: 'numeric', month: 'short' });
        if (monthKey in monthlyProfitMap) {
          const revenue = phone.sellPrice || 0;
          const cost = phone.buyPrice;
          const expenseForPhone = profitByPhone[phone.id] || 0;
          const profit = revenue - cost - expenseForPhone;
          monthlyProfitMap[monthKey] += profit;
        }
      }
    });

    const data = Object.entries(monthlyProfitMap).map(([month, profit]) => ({
      month,
      profit,
    }));

    setMonthlyData(data);
  };

  const StatCard = ({ label, value, trend, icon: Icon }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend !== undefined && (
            <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </p>
          )}
        </div>
        <Icon className="w-10 h-10 text-blue-500" />
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Analytics Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Total Profit"
          value={`$${metrics.totalProfit.toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Gross Revenue"
          value={`$${metrics.grossRevenue.toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Total Expenses"
          value={`$${metrics.totalExpenses.toFixed(2)}`}
          icon={TrendingDown}
        />
        <StatCard
          label="Inventory Value"
          value={`$${metrics.inventoryValue.toFixed(2)}`}
          icon={Package}
        />
        <StatCard
          label="Average Days to Sell"
          value={metrics.avgDaysToSell}
          icon={TrendingUp}
        />
        <StatCard
          label="Phones in Stock"
          value={phones.filter(p => p.status === 'In Stock').length}
          icon={Package}
        />
      </div>

      {/* Monthly Profit Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Monthly Profit (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#f3f4f6', 
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
              formatter={(value: any) => `$${value.toFixed(2)}`}
            />
            <Bar dataKey="profit" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Aging Stock */}
      {metrics.agingStock.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-100">Aging Stock Alert</h2>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
            {metrics.agingStock.length} phone(s) have been in stock for over 30 days:
          </p>
          <div className="space-y-2">
            {metrics.agingStock.map((phone, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-300 dark:border-yellow-600">
                <p className="font-medium text-gray-900 dark:text-white">
                  {phone.model} - {phone.daysOld} days old
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bought: {phone.buyDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
