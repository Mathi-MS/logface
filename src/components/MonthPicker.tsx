import { ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import { ATTENDANCE_START } from '../lib/attendance'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Vertical year + month selector shown on the right of the employee attendance, leave and payroll views.
// Future months and months before records start are disabled.
export default function MonthPicker({
  year,
  month,
  today,
  onChange,
  stickyTop = 'lg:top-[120px]',
}: {
  year: number
  month: number
  today: Date
  onChange: (year: number, month: number) => void
  stickyTop?: string
}) {
  const isFuture = (y: number, m: number) => y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth())
  const beforeStart = (y: number, m: number) => new Date(y, m + 1, 0) < ATTENDANCE_START
  const changeYear = (y: number) => onChange(y, isFuture(y, month) ? today.getMonth() : month)

  return (
    <aside className={clsx('flex flex-col items-center border border-[#d6d6d6] bg-white py-3 lg:sticky', stickyTop)}>
      <button
        type="button"
        aria-label="Next year"
        disabled={year >= today.getFullYear()}
        onClick={() => changeYear(year + 1)}
        className="rounded p-1 text-[#333] hover:bg-[#f3f4f6] disabled:opacity-30"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <span className="text-[14px] font-semibold text-[#222]">{year}</span>
      <button
        type="button"
        aria-label="Previous year"
        disabled={year <= ATTENDANCE_START.getFullYear()}
        onClick={() => changeYear(year - 1)}
        className="rounded p-1 text-[#333] hover:bg-[#f3f4f6] disabled:opacity-30"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="mt-2 flex w-full flex-col items-center gap-0.5 px-2">
        {MONTHS.map((m, i) => {
          const disabled = isFuture(year, i) || beforeStart(year, i)
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => onChange(year, i)}
              aria-pressed={i === month}
              className={clsx(
                'w-full max-w-[64px] rounded py-1.5 text-[14px] transition-colors',
                i === month ? 'bg-[#1565c0] text-white' : 'text-[#222] hover:bg-[#f3f4f6]',
                disabled && 'cursor-not-allowed text-[#c7ccd4] hover:bg-transparent',
              )}
            >
              {m}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
