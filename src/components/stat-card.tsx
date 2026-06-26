type StatCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <strong className="mt-3 block text-3xl font-semibold text-slate-950">
        {value}
      </strong>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}
