interface Props {
  title: string
  subtitle: string
}

export const EmptyState = ({ title, subtitle }: Props) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
    <p className="text-base font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-500">{subtitle}</p>
  </div>
)
