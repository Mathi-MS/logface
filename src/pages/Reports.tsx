import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import clsx from 'clsx'
import { fromISODate, toISODate } from '../lib/payroll'
import { downloadExcel, openPdf, reports, type ReportDefinition, type ReportFormat } from '../lib/reports'

function FileIcon({ format, className }: { format: ReportFormat; className?: string }) {
  const color = format === 'pdf' ? '#c62828' : '#2e9b46'
  return (
    <svg viewBox="0 0 24 30" className={clsx('h-8 w-[26px]', className)} role="img" aria-label={format === 'pdf' ? 'PDF' : 'Excel'}>
      <path d="M2 1h14l6 6v22H2z" fill="#fff" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 1v6h6" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      {format === 'pdf' ? (
        <path
          d="M6 24c2-1 4-4 5.5-8 .8-2.2.9-4.2.2-4.6-.8-.4-1.5 1.2-1 3.5.6 2.6 3 5.4 6 6.3 1.4.4 2.4.1 2.3-.6-.1-.8-1.8-1-4-.6-3 .5-6.6 2-8.7 3.6-.8.6-.8 1.2-.3.4z"
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      ) : (
        <path d="M7.5 14l8 10M15.5 14l-8 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  )
}

const MAX_DAYS = 366

function ReportDialog({ report, onClose }: { report: ReportDefinition; onClose: () => void }) {
  const [today] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })
  const [from, setFrom] = useState(() => toISODate(new Date(today.getFullYear(), today.getMonth(), 1)))
  const [to, setTo] = useState(() => toISODate(today))
  const [format, setFormat] = useState<ReportFormat>(report.formats[0])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const fromDate = from ? fromISODate(from) : undefined
  const toDate = to ? fromISODate(to) : undefined
  const error = !fromDate || !toDate
    ? 'Please choose both dates.'
    : fromDate > toDate
      ? 'From date must be on or before the To date.'
      : toDate > today
        ? 'To date cannot be in the future.'
        : (toDate.getTime() - fromDate.getTime()) / 86400000 + 1 > MAX_DAYS
          ? `Please choose a period of at most ${MAX_DAYS} days.`
          : ''

  const generate = () => {
    if (error || !fromDate || !toDate) return
    const range = { from: fromDate, to: toDate, today }
    const table = report.build(range)
    if (!table.rows.length) return setMessage('No data available for the selected period.')
    if (format === 'excel') downloadExcel(report, table, range)
    else if (!openPdf(report, table, range)) return setMessage('Please allow pop-ups to open the PDF report.')
    onClose()
  }

  const field = 'mt-1 h-9 w-full rounded-md border border-[#d1d5db] px-2.5 text-[13px] outline-none focus:border-[#1976d2]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="w-full max-w-[440px] rounded-lg bg-white text-[13px] text-[#333] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#e5e7eb] px-5 py-4">
          <div className="min-w-0">
            <h3 id="report-dialog-title" className="text-[16px] font-medium text-[#222]">
              {report.title}
            </h3>
            <p className="text-[12px] text-[#888]">Choose the period for the report.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-[#888] hover:bg-[#f3f4f6]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-[#555]">
              From
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => {
                  setFrom(e.target.value)
                  setMessage('')
                }}
                className={field}
              />
            </label>
            <label className="block text-[12px] text-[#555]">
              To
              <input
                type="date"
                value={to}
                min={from || undefined}
                max={toISODate(today)}
                onChange={(e) => {
                  setTo(e.target.value)
                  setMessage('')
                }}
                className={field}
              />
            </label>
          </div>

          {report.formats.length > 1 && (
            <fieldset>
              <legend className="text-[12px] text-[#555]">Format</legend>
              <div className="mt-1.5 flex gap-3">
                {report.formats.map((f) => (
                  <label
                    key={f}
                    className={clsx(
                      'flex flex-1 cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2',
                      format === f ? 'border-[#1976d2] bg-[#eef6ff]' : 'border-[#d1d5db] hover:bg-[#f9fafb]',
                    )}
                  >
                    <input
                      type="radio"
                      name="report-format"
                      checked={format === f}
                      onChange={() => setFormat(f)}
                      className="sr-only"
                    />
                    <FileIcon format={f} className="h-6 w-5" />
                    {f === 'pdf' ? 'PDF' : 'Excel (CSV)'}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {(error || message) && <p className="text-[12px] text-[#dc2626]">{error || message}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
          <button type="button" onClick={onClose} className="h-8 rounded-md border border-[#d1d5db] px-3 hover:bg-[#f9fafb]">
            Cancel
          </button>
          <button
            type="button"
            disabled={!!error}
            onClick={generate}
            className="flex h-8 items-center gap-1.5 rounded-md bg-[#1976d2] px-3 text-white hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> {format === 'pdf' ? 'Open PDF' : 'Download Excel'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const [active, setActive] = useState<ReportDefinition | null>(null)

  return (
    <div>
      <h1 className="px-3 text-[24px] text-[#546e7a]">Reports</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <article key={r.id} className="flex min-h-[290px] flex-col bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
            <div className="flex-1 px-4 pt-5">
              <h2 title={r.title} className="truncate text-[18px] text-[#444]">
                {r.title}
              </h2>
              <p className="mt-5 text-[13px] leading-[2] text-[#333]">{r.description}</p>
            </div>
            <div className="flex items-center justify-between border-t border-[#e5e5e5] px-4 py-3">
              <div className="flex gap-2.5">
                {r.formats.map((f) => (
                  <FileIcon key={f} format={f} />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActive(r)}
                className="rounded-sm border border-[#1976d2] px-3 py-1.5 text-[14px] text-[#1976d2] transition-colors hover:bg-[#1976d2] hover:text-white"
              >
                Get Report
              </button>
            </div>
          </article>
        ))}
      </div>

      {active && <ReportDialog report={active} onClose={() => setActive(null)} />}
    </div>
  )
}
