import React from 'react';
import { StatsCards } from './components/StatsCards';
import { RevenueChart } from './components/RevenueChart';
import { SalesBarChart } from './components/SalesBarChart';
import { UsersDonutChart } from './components/UsersDonutChart';
import { RecentOrdersTable } from './components/RecentOrdersTable';

const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Visão geral do seu negócio</p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <UsersDonutChart />
        </div>
      </div>

      <SalesBarChart />

      <RecentOrdersTable />
    </div>
  );
};

export default Dashboard;
