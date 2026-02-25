type StatCardProps = {
  label: string;
  value: number;
  helper?: string;
};

export const StatCard = ({ label, value, helper }: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
  );
};

export default StatCard;
