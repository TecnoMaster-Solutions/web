"use client";

import { StatCard } from "./StatCard";
import type { AppointmentStat } from "../hooks/useAppointmentStats";

export type AppointmentStatsProps = {
  stats: AppointmentStat[];
};

const AppointmentStats = ({ stats }: AppointmentStatsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {stats.map((stat) => (
      <StatCard key={stat.label} {...stat} />
    ))}
  </div>
);

export default AppointmentStats;
