import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowLeftRight,
  BadgeCheck,
  CalendarDays,
  CalendarRange,
  CircleMinus,
  Download,
  FileText,
  Info,
  Landmark,
  Send,
  UserRound,
  Wallet,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import MonthPicker from '../components/MonthPicker'
import StatusBadge from '../components/StatusBadge'
import { employees, type Employee } from '../data/employees'
import {
  amount,
  breakdown,
  defaultSalary,
  downloadPayslip,
  fmtShortDate,
  fromISODate,
  inr,
  monthLabel,
  monthRangeOf,
  paymentInfo,
  payslipPath,
  recordKey,
  releasedMonths,
  updateRecord,
  usePayrollRecords,
  type LineItem,
  type Period,
} from '../lib/payroll'

const card = 'rounded-lg border border-[#e5e7eb] bg-white'

const tones = {
  green: { box: 'border-[#d3f0e0] bg-[#effaf4]', icon: 'bg-[#d9f3e5] text-[#15803d]', value: 'text-[#166534]', label: 'text-[#166534]' },
  red: { box: 'border-[#fbd5d5] bg-[#fff3f3]', icon: 'bg-[#fde2e2] text-[#dc2626]', value: 'text-[#dc2626]', label: 'text-[#b91c1c]' },
  blue: { box: 'border-[#d6e6fb] bg-[#eef5ff]', icon: 'bg-[#dbe9fd] text-[#1976d2]', value: 'text-[#1976d2]', label: 'text-[#1e3a8a]' },
  purple: { box: 'border-[#e6defa] bg-[#f6f2ff]', icon: 'bg-[#ebe3fd] text-[#7c3aed]', value: 'text-[#1f2937]', label: 'text-[#6d28d9]' },
}
type Tone = keyof typeof tones

function SummaryCard({ tone, icon: Icon, label, value, sub }: { tone: Tone; icon: LucideIcon; label: string; value: string; sub?: string }) {
  const t = tones[tone]
  return (
    <div className={clsx('flex items-center gap-4 rounded-lg border px-4 py-4', t.box)}>
      <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', t.icon)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className={clsx('text-[11.5px]', t.label)}>{label}</div>
        <div className={clsx('truncate font-semibold', sub ? 'text-[15px]' : 'text-[20px]', t.value)}>{value}</div>
        {sub && <div className="truncate text-[12px] text-[#555]">{sub}</div>}
      </div>
    </div>
  )
}

function LineItemsPanel({
  tone,
  icon: Icon,
  title,
  items,
  total,
  totalLabel,
}: {
  tone: 'green' | 'red'
  icon: LucideIcon
  title: string
  items: LineItem[]
  total: number
  totalLabel: string
}) {
  const t = tones[tone]

  return (
    <section className={clsx(card, 'p-4')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={clsx('flex h-9 w-9 items-center justify-center rounded-full', t.icon)}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <h2 className="text-[15px] font-medium text-[#1f2937]">{title}</h2>
        </div>
        <span className={clsx('text-[15px] font-semibold', t.value)}>{inr(total)}</span>
      </div>

      <table className="mt-3 w-full text-left text-[12.5px]">
        <thead>
          <tr className="bg-[#f3f5f8] text-[11.5px] text-[#374151]">
            <th className="rounded-l-md px-3 py-2 font-medium">Description</th>
            <th className="px-3 py-2 text-right font-medium">Amount (₹)</th>
            <th className="rounded-r-md px-3 py-2 pl-8 font-medium">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.label} className="border-b border-[#f0f0f0] text-[#1f2937]">
              <td className="px-3 py-2.5">{i.label}</td>
              <td className="px-3 py-2.5 text-right">{amount(i.amount)}</td>
              <td className="px-3 py-2.5 pl-8 text-[#555]">{i.remark ?? '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={clsx('font-medium', tone === 'green' ? 'bg-[#effaf4] text-[#166534]' : 'bg-[#fff3f3] text-[#b91c1c]')}>
            <td className="rounded-l-md px-3 py-2.5">{totalLabel}</td>
            <td className="px-3 py-2.5 text-right">{amount(total)}</td>
            <td className="rounded-r-md" />
          </tr>
        </tfoot>
      </table>
    </section>
  )
}

function DetailItem({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f3f5f8] text-[#4b5563]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] text-[#888]">{label}</div>
        <div className="truncate text-[12.5px] text-[#1f2937]">{children}</div>
      </div>
    </div>
  )
}

const payPeriodLabel = (m: Period) => {
  const r = monthRangeOf(m)
  return `${fmtShortDate(r.from)} - ${fmtShortDate(r.to)}`
}
// Payslip for one employee and month, with the year/month picker on the right.
export function PayslipView({
  employee,
  year,
  month,
  today,
  onChange,
  stickyTop = 'lg:top-[80px]',
}: {
  employee: Employee
  year: number
  month: number
  today: Date
  onChange: (year: number, month: number) => void
  stickyTop?: string
}) {
  const records = usePayrollRecords()
  const period: Period = { year, month }
  const released = releasedMonths.some((m) => m.year === year && m.month === month)
  const record = (released && records[recordKey(period, employee.code)]) || { status: 'Pending' as const }
  const s = breakdown(record.salary ?? defaultSalary(employee))
  const pay = paymentInfo(employee)
  const range = monthRangeOf(period)
  const payPeriodText =
    record.payPeriodStart && record.payPeriodEnd
      ? `${fmtShortDate(fromISODate(record.payPeriodStart))} - ${fmtShortDate(fromISODate(record.payPeriodEnd))}`
      : payPeriodLabel(period)
  const paymentDateText = fmtShortDate(record.paymentDate ? fromISODate(record.paymentDate) : range.to)
  const available = record.status !== 'Pending'
  const payslip = { employee, period, record }

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_96px]">
      <div className="min-w-0">
        <section className={clsx(card, 'flex flex-wrap items-center justify-between gap-4 px-5 py-4')}>
          <div className="flex items-center gap-4">
            <Avatar variant={employee.gender === 'Female' ? 'female' : 'male'} className="h-14 w-14" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[17px] font-semibold text-[#1f2937]">{employee.name}</h1>
                <StatusBadge status={record.status} />
              </div>
              <div className="text-[12.5px] text-[#6b7280]">{employee.code}</div>
              <div className="mt-0.5 text-[12.5px] text-[#4b5563]">
                {employee.designation} <span className="mx-1.5 text-[#9ca3af]">•</span> {employee.service} Department
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={!available}
            onClick={() => downloadPayslip(payslip)}
            className="flex h-10 items-center gap-2 rounded-md border border-[#1976d2] bg-white px-4 text-[12.5px] font-medium text-[#1976d2] hover:bg-[#eef6ff] disabled:cursor-not-allowed disabled:border-[#d1d5db] disabled:text-[#9ca3af] disabled:hover:bg-white"
          >
            <Download className="h-4 w-4" /> Download Payslip (PDF)
          </button>
        </section>

        {!available ? (
          <section className={clsx(card, 'mt-3 px-6 py-14 text-center')}>
            <FileText className="mx-auto h-8 w-8 text-[#cbd5e1]" />
            <p className="mt-3 text-[14px] font-medium text-[#1f2937]">Payslip not available yet</p>
            {released ? (
              <>
                <p className="mt-1 text-[12.5px] text-[#6b7280]">
                  Payroll for {monthLabel(period)} hasn't been uploaded for {employee.name}.
                </p>
                <Link to="/payroll" className="mt-4 inline-block text-[12.5px] font-medium text-[#1976d2] hover:underline">
                  Go to Employee Payslips to upload
                </Link>
              </>
            ) : (
              <p className="mt-1 text-[12.5px] text-[#6b7280]">Payroll for {monthLabel(period)} hasn't been released yet.</p>
            )}
          </section>
        ) : (
          <>
            {record.status === 'Draft' && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#fde3c0] bg-[#fff8ee] px-4 py-2.5 text-[12.5px] text-[#9a3412]">
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" /> This payslip is a draft and hasn't been published to the employee yet.
                </span>
                <button
                  type="button"
                  onClick={() => updateRecord(recordKey(period, employee.code), { status: 'Published' })}
                  className="flex h-8 items-center gap-1.5 rounded-md bg-[#1976d2] px-3 font-medium text-white hover:bg-[#1565c0]"
                >
                  <Send className="h-3.5 w-3.5" /> Publish
                </button>
              </div>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard tone="green" icon={Wallet} label="Total Earnings" value={inr(s.gross)} />
              <SummaryCard tone="red" icon={CircleMinus} label="Total Deductions" value={inr(s.totalDeductions)} />
              <SummaryCard tone="blue" icon={WalletCards} label="Net Pay" value={inr(s.net)} />
              <SummaryCard tone="purple" icon={Landmark} label="Payment Mode" value={pay.mode} sub={pay.bank} />
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <LineItemsPanel tone="green" icon={Wallet} title="Earnings" items={s.earnings} total={s.gross} totalLabel="Total Earnings" />
              <LineItemsPanel
                tone="red"
                icon={CircleMinus}
                title="Deductions"
                items={s.deductions}
                total={s.totalDeductions}
                totalLabel="Total Deductions"
              />
            </div>

            <section className={clsx(card, 'mt-3')}>
              <h2 className="border-b border-[#eef0f3] px-5 py-3 text-[15px] font-medium text-[#1f2937]">Additional Details</h2>
              <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <DetailItem icon={CalendarDays} label="Payment Date">
                    {paymentDateText}
                  </DetailItem>
                  <DetailItem icon={CalendarRange} label="Pay Period">
                    {payPeriodText}
                  </DetailItem>
                  <DetailItem icon={ArrowLeftRight} label="Payment Mode">
                    {pay.mode}
                  </DetailItem>
                  <DetailItem icon={UserRound} label="Employee Type">
                    {pay.employeeType}
                  </DetailItem>
                  <DetailItem icon={Landmark} label="Bank Details">
                    {pay.bank}
                  </DetailItem>
                  <DetailItem icon={BadgeCheck} label="PF UAN">
                    {pay.uan}
                  </DetailItem>
                  {record.fileUrl && (
                    <DetailItem icon={FileText} label="Uploaded Document">
                      <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-[#1976d2] hover:underline">
                        {record.fileName}
                      </a>
                    </DetailItem>
                  )}
                </div>
                <div className="flex gap-3 rounded-lg border border-[#d6e6fb] bg-[#eef5ff] p-4 text-[12.5px] text-[#334155]">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1976d2]" />
                  <div>
                    <div className="font-medium text-[#1f2937]">Note</div>
                    <p className="mt-1 leading-relaxed">
                      {record.status === 'Published'
                        ? `Your payslip for ${monthLabel(period)} is available for download.`
                        : `The payslip for ${monthLabel(period)} will be available once it is published.`}{' '}
                      If you have any queries, please reach out to the HR team.
                    </p>
                    {record.notes && (
                      <p className="mt-2 whitespace-pre-line border-t border-[#d6e6fb] pt-2 text-[#1f2937]">
                        <span className="font-medium">Remarks:</span> {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <MonthPicker year={year} month={month} today={today} onChange={onChange} stickyTop={stickyTop} />
    </div>
  )
}

const parseYearMonth = (key: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(key)
  if (!m) return undefined
  const month = Number(m[2]) - 1
  return month >= 0 && month <= 11 ? { year: Number(m[1]), month } : undefined
}

export default function PayslipDetail() {
  const { code = '', period: periodParam = '' } = useParams()
  const navigate = useNavigate()
  const [today] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })

  const employee = employees.find((e) => e.code === code)
  const ym = parseYearMonth(periodParam)

  const backLink = (
    <Link to="/payroll" className="inline-flex items-center gap-1.5 text-[12.5px] text-[#4b5563] hover:text-[#1976d2]">
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Employee Payslips
    </Link>
  )

  if (!employee || !ym) {
    return (
      <div>
        {backLink}
        <div className={clsx(card, 'mt-4 px-6 py-14 text-center text-[13px] text-[#888]')}>Payslip not found.</div>
      </div>
    )
  }

  return (
    <div>
      {backLink}
      <div className="mt-3">
        <PayslipView
          employee={employee}
          year={ym.year}
          month={ym.month}
          today={today}
          onChange={(year, month) => navigate(payslipPath(employee.code, { year, month }))}
        />
      </div>
    </div>
  )
}
