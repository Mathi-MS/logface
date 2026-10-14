import clsx from 'clsx'
import type { PayrollStatus } from '../lib/payroll'

const statusStyles: Record<PayrollStatus, string> = {
  Published: 'bg-[#e7f8ef] text-[#15803d] [--dot:#22c55e]',
  Draft: 'bg-[#fff4e5] text-[#c2410c] [--dot:#f59e0b]',
  Pending: 'bg-[#f1f5f9] text-[#64748b] [--dot:#94a3b8]',
}

export default function StatusBadge({ status }: { status: PayrollStatus }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium', statusStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-(--dot)" />
      {status}
    </span>
  )
}
