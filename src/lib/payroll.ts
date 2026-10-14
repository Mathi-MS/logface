import { useSyncExternalStore } from 'react'
import { employees, type Employee } from '../data/employees'

// TODO: replace mock data with API responses
export type Period = { year: number; month: number }

export const releasedMonths: Period[] = [
  { year: 2026, month: 8 },
  { year: 2026, month: 7 },
  { year: 2026, month: 6 },
]

export const periodKey = (m: Period) => `${m.year}-${String(m.month + 1).padStart(2, '0')}`
export const parsePeriodKey = (key: string) => releasedMonths.find((m) => periodKey(m) === key)
export const monthLabel = (m: Period) =>
  new Date(m.year, m.month, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
export const fmtDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
export const fmtShortDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`

export type DateRange = { from: Date; to: Date }
export const monthRangeOf = (m: Period): DateRange => ({
  from: new Date(m.year, m.month, 1),
  to: new Date(m.year, m.month + 1, 0),
})
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const fromISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime()

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
export const amount = (n: number) => n.toLocaleString('en-IN')

// ---- Salary ----

const monthlyGross: Record<string, number> = {
  'Team Lead': 120000,
  'Project Manager': 140000,
  'Finance Manager': 110000,
  'Marketing Manager': 105000,
  'Backend Developer': 85000,
  'Frontend Developer': 80000,
  'UI/UX Designer': 75000,
  'Business Analyst': 70000,
  'QA Analyst': 60000,
  'Support Engineer': 45000,
  Accountant: 50000,
  'HR Executive': 45000,
  Recruiter: 40000,
  'Sales Executive': 20000,
}

export type Salary = {
  basic: number
  hra: number
  special: number
  other: number
  pf: number
  esi: number
  pt: number
  tds: number
}

// Column order used by the Excel/CSV template
export const SALARY_FIELDS: (keyof Salary)[] = ['basic', 'hra', 'special', 'other', 'pf', 'esi', 'pt', 'tds']
export const SALARY_FIELD_LABELS = ['Basic', 'HRA', 'Special Allowance', 'Other Allowance', 'PF', 'ESI', 'Professional Tax', 'TDS']

export function defaultSalary(e: Employee): Salary {
  const gross = monthlyGross[e.designation] ?? 40000
  const basic = Math.round(gross * 0.58)
  const hra = Math.round(gross * 0.23)
  const special = Math.round(gross * 0.12)
  return {
    basic,
    hra,
    special,
    other: gross - basic - hra - special,
    pf: Math.round(basic * 0.12),
    esi: gross <= 21000 ? Math.round(gross * 0.0075) : 0,
    pt: 200,
    tds: gross > 60000 ? Math.round(gross * 0.07) : 0,
  }
}

export type LineItem = { label: string; amount: number; remark?: string }

export function breakdown(s: Salary) {
  const earnings: LineItem[] = [
    { label: 'Basic Salary', amount: s.basic },
    { label: 'HRA', amount: s.hra },
    { label: 'Special Allowance', amount: s.special },
    { label: 'Other Allowance', amount: s.other },
  ]
  const deductions: LineItem[] = [
    { label: 'Provident Fund (PF)', amount: s.pf, remark: 'Employee Contribution' },
    { label: 'ESI', amount: s.esi, remark: s.esi ? 'Employee Contribution' : 'Not applicable' },
    { label: 'Professional Tax', amount: s.pt },
    { label: 'TDS', amount: s.tds },
  ]
  const gross = earnings.reduce((t, i) => t + i.amount, 0)
  const totalDeductions = deductions.reduce((t, i) => t + i.amount, 0)
  return { gross, earnings, deductions, totalDeductions, net: gross - totalDeductions }
}

// ---- Payment details ----

const banks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank']

export function paymentInfo(e: Employee) {
  const digits = e.code.replace(/\D/g, '').padStart(4, '0')
  const n = Number(digits)
  return {
    mode: 'Bank Transfer',
    bank: `${banks[n % banks.length]} **** ${String(1000 + ((n * 37) % 9000))}`,
    employeeType: e.employmentType,
    uan: `1001 2345 ${digits.slice(-4)}`,
  }
}

// ---- Payroll records (shared in-memory store) ----

export type PayrollStatus = 'Published' | 'Draft' | 'Pending'
export type PayRecord = {
  status: PayrollStatus
  salary?: Salary
  fileUrl?: string
  fileName?: string
  // ISO dates (yyyy-mm-dd) captured on upload; default to the calendar month
  payPeriodStart?: string
  payPeriodEnd?: string
  paymentDate?: string
  notes?: string
}

export const recordKey = (p: Period, code: string) => `${periodKey(p)}|${code}`

// Older months are fully published; the latest month is still in progress
function initialRecords() {
  const records: Record<string, PayRecord> = {}
  releasedMonths.forEach((p, mi) =>
    employees.forEach((e, i) => {
      const status: PayrollStatus = mi > 0 ? 'Published' : i % 5 === 1 ? 'Draft' : i % 7 === 3 ? 'Pending' : 'Published'
      records[recordKey(p, e.code)] = { status, salary: status === 'Pending' ? undefined : defaultSalary(e) }
    }),
  )
  return records
}

let records = initialRecords()
const listeners = new Set<() => void>()

const getRecords = () => records
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const usePayrollRecords = () => useSyncExternalStore(subscribe, getRecords)

export function setRecords(update: (current: Record<string, PayRecord>) => Record<string, PayRecord>) {
  records = update(records)
  listeners.forEach((l) => l())
}

export const updateRecord = (key: string, patch: Partial<PayRecord>) =>
  setRecords((r) => ({ ...r, [key]: { ...(r[key] ?? { status: 'Pending' }), ...patch } }))

export const payslipPath = (code: string, p: Period) => `/payroll/${encodeURIComponent(code)}/${periodKey(p)}`

// ---- Downloads ----

export type Payslip = { employee: Employee; period: Period; record: PayRecord }

const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

export function downloadPayslip({ employee, period, record }: Payslip) {
  if (record.fileUrl) {
    const a = document.createElement('a')
    a.href = record.fileUrl
    a.download = record.fileName ?? `payslip-${employee.code}-${periodKey(period)}.pdf`
    a.click()
    return
  }
  const s = breakdown(record.salary ?? defaultSalary(employee))
  const pay = paymentInfo(employee)
  const range = monthRangeOf(period)
  const e = {
    name: escapeHtml(employee.name),
    code: escapeHtml(employee.code),
    service: escapeHtml(employee.service),
    designation: escapeHtml(employee.designation),
  }
  const rows = (items: LineItem[]) =>
    items
      .map((i) => `<tr><td>${i.label}</td><td class="r">${inr(i.amount)}</td><td class="m">${i.remark ?? '-'}</td></tr>`)
      .join('')
  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) return
  win.document.write(`<!doctype html><html><head><title>Payslip ${e.code} ${monthLabel(period)}</title>
<style>
body{font-family:Roboto,Arial,sans-serif;color:#222;margin:40px;font-size:13px}
h1{font-size:20px;margin:0}h2{font-size:14px;margin:24px 0 8px}
.muted{color:#777}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:16px}
table{width:100%;border-collapse:collapse}td{padding:6px 0;border-bottom:1px solid #eee}.r{text-align:right}.m{color:#777;padding-left:24px}
.net{margin-top:24px;padding:12px;background:#f0f7ff;font-size:15px;display:flex;justify-content:space-between}
</style></head><body>
<h1>Payslip - ${monthLabel(period)}</h1><div class="muted">Logface Payroll</div>
<div class="grid"><div><b>Employee:</b> ${e.name}</div><div><b>Employee ID:</b> ${e.code}</div>
<div><b>Department:</b> ${e.service}</div><div><b>Designation:</b> ${e.designation}</div>
<div><b>Pay Period:</b> ${fmtShortDate(range.from)} - ${fmtShortDate(range.to)}</div><div><b>Payment:</b> ${pay.mode}, ${pay.bank}</div></div>
<h2>Earnings</h2><table>${rows(s.earnings)}<tr><td><b>Total Earnings</b></td><td class="r"><b>${inr(s.gross)}</b></td><td></td></tr></table>
<h2>Deductions</h2><table>${rows(s.deductions)}<tr><td><b>Total Deductions</b></td><td class="r"><b>${inr(s.totalDeductions)}</b></td><td></td></tr></table>
<div class="net"><b>Net Pay</b><b>${inr(s.net)}</b></div>
</body></html>`)
  win.document.close()
  win.focus()
  win.print()
}

// ---- Excel (CSV) template & import ----

export function downloadTemplate(period: Period) {
  const header = ['Employee ID', 'Month (YYYY-MM)', ...SALARY_FIELD_LABELS]
  const rows = employees
    .filter((e) => !e.relieved)
    .map((e) => {
      const s = defaultSalary(e)
      return [e.code, periodKey(period), ...SALARY_FIELDS.map((f) => s[f])].join(',')
    })
  const blob = new Blob([[header.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `payroll-template-${periodKey(period)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function parseCsv(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const cells: string[] = []
      let cur = ''
      let quoted = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (quoted && line[i + 1] === '"') {
            cur += '"'
            i++
          } else quoted = !quoted
        } else if (ch === ',' && !quoted) {
          cells.push(cur.trim())
          cur = ''
        } else cur += ch
      }
      cells.push(cur.trim())
      return cells
    })
}
