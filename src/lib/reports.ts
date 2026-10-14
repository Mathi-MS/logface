import { contactOf, employees, type Employee } from '../data/employees'
import {
  fmtDuration,
  fmtTime,
  monthAttendance,
  rand,
  summarize,
  type DayRecord,
  type DayStatus,
  type LeaveType,
} from './attendance'
import { fmtShortDate } from './payroll'

// TODO: generate reports on the server once the API exists; these are built from mock data

export type ReportFormat = 'pdf' | 'excel'
export type ReportTable = { columns: string[]; rows: (string | number)[][] }
export type ReportRange = { from: Date; to: Date; today: Date }

export type ReportDefinition = {
  id: string
  title: string
  description: string
  formats: ReportFormat[]
  build: (range: ReportRange) => ReportTable
}

const PROJECT = 'ABC'
const unitOf = (e: Employee) => e.unit ?? 'Puducherry'
const active = () => employees.filter((e) => !e.relieved)

const statusCode: Record<DayStatus, string> = {
  Present: 'P',
  Late: 'LT',
  Absent: 'A',
  Leave: 'L',
  Weekoff: 'WO',
  Holiday: 'H',
  NotPunched: '-',
}
const statusLabel: Record<DayStatus, string> = {
  Present: 'Present',
  Late: 'Late Entry',
  Absent: 'Absent',
  Leave: 'Leave',
  Weekoff: 'Weekoff',
  Holiday: 'Holiday',
  NotPunched: 'Not yet punched',
}

const monthsBetween = (from: Date, to: Date) => {
  const out: { year: number; month: number }[] = []
  for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    out.push({ year: d.getFullYear(), month: d.getMonth() })
  }
  return out
}

// Attendance days for an employee within [from, to], oldest first
function daysInRange(e: Employee, { from, to, today }: ReportRange): DayRecord[] {
  return monthsBetween(from, to)
    .flatMap(({ year, month }) => monthAttendance(e, year, month, today))
    .filter((d) => d.date >= from && d.date <= to)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

const percent = (worked: number, working: number) => (working ? `${Math.round((worked / working) * 100)}%` : '-')
const monthName = (y: number, m: number) => new Date(y, m, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })

function attendanceSummaryRow(e: Employee, days: DayRecord[]) {
  const s = summarize(days)
  const working = s.worked + s.absent + s.leave
  return [e.code, e.name, e.service, e.designation, s.worked, s.absent, s.leave, s.weekoff, percent(s.worked, working)]
}

const LEAVE_ALLOWANCE: Record<LeaveType, number> = { 'Casual Leave': 12, 'Sick Leave': 6, 'Earned Leave': 15 }

export const reports: ReportDefinition[] = [
  {
    id: 'unit-wise-attendance',
    title: 'Unit Wise Attendance',
    description:
      'View employees attendance details in a Unit. Report includes day wise attendance details with Service and Designation grouped, employee attendance percentage, shift worked. Report can be generated billing cycle wise. Summary of total worked man-days, Overall attendance percentage, Total absent days, Total leave days can be viewed.',
    formats: ['excel'],
    build: (r) => {
      const list = active().sort((a, b) => a.service.localeCompare(b.service) || a.designation.localeCompare(b.designation))
      const rows = list.map((e) => [unitOf(e), ...attendanceSummaryRow(e, daysInRange(e, r)), 'General Shift'])
      const sum = (col: number) => rows.reduce((t, row) => t + Number(row[col]), 0)
      const [worked, absent, leave] = [sum(5), sum(6), sum(7)]
      rows.push(['Total', '', '', '', '', worked, absent, leave, '', percent(worked, worked + absent + leave), ''])
      return {
        columns: ['Unit', 'Employee ID', 'Name', 'Service', 'Designation', 'Worked Days', 'Absent Days', 'Leave Days', 'Weekoff/Holiday', 'Attendance %', 'Shift'],
        rows,
      }
    },
  },
  {
    id: 'day-wise-attendance',
    title: 'Day Wise Attendance',
    description: 'View attendance details day wise for employees.',
    formats: ['pdf', 'excel'],
    build: (r) => ({
      columns: ['Date', 'Employee ID', 'Name', 'Status', 'In Time', 'Out Time', 'Late By'],
      rows: active().flatMap((e) =>
        daysInRange(e, r).map((d) => [
          fmtShortDate(d.date),
          e.code,
          e.name,
          statusLabel[d.status],
          d.inMinutes !== undefined ? fmtTime(d.inMinutes) : '-',
          d.outMinutes !== undefined ? fmtTime(d.outMinutes) : '-',
          d.lateMinutes ? fmtDuration(d.lateMinutes) : '-',
        ]),
      ),
    }),
  },
  {
    id: 'attendance-summary-month-wise',
    title: 'Employee Attendance Summary Month Wise',
    description: 'View the attendance summary by an employee for the month or selected period.',
    formats: ['excel'],
    build: (r) => ({
      columns: ['Month', 'Employee ID', 'Name', 'Worked Days', 'Absent Days', 'Leave Days', 'Late Days', 'Late Hours', 'OT Hours'],
      rows: monthsBetween(r.from, r.to).flatMap(({ year, month }) =>
        active().map((e) => {
          const days = daysInRange(e, r).filter((d) => d.date.getMonth() === month && d.date.getFullYear() === year)
          const s = summarize(days)
          return [monthName(year, month), e.code, e.name, s.worked, s.absent, s.leave, s.lateDays, fmtDuration(s.lateMinutes), fmtDuration(s.otMinutes)]
        }),
      ),
    }),
  },
  {
    id: 'distance-travel-month-wise',
    title: 'Distance Travel Employee Month Wise',
    description: 'View the distance travelled by an employee for the month or selected period.',
    formats: ['pdf', 'excel'],
    build: (r) => ({
      columns: ['Month', 'Employee ID', 'Name', 'Designation', 'Travel Days', 'Distance (km)'],
      rows: monthsBetween(r.from, r.to).flatMap(({ year, month }) =>
        active()
          .filter((e) => e.travel)
          .map((e) => {
            const worked = daysInRange(e, r).filter(
              (d) => d.date.getMonth() === month && d.date.getFullYear() === year && (d.status === 'Present' || d.status === 'Late'),
            )
            const km = worked.reduce((t, d) => t + Math.round(15 + rand(e.code, d.date.getTime(), 'km') * 85), 0)
            return [monthName(year, month), e.code, e.name, e.designation, worked.length, km]
          }),
      ),
    }),
  },
  {
    id: 'unit-month-wise-detailed',
    title: 'Unit month wise detailed report',
    description: 'View month wise detailed report for employees based on unit level.',
    formats: ['excel'],
    build: (r) => {
      const units = [...new Set(active().map(unitOf))].sort()
      return {
        columns: ['Unit', 'Month', 'Employees', 'Worked Man-days', 'Absent Days', 'Leave Days', 'Late Days', 'Attendance %'],
        rows: units.flatMap((unit) =>
          monthsBetween(r.from, r.to).map(({ year, month }) => {
            const people = active().filter((e) => unitOf(e) === unit)
            const days = people.flatMap((e) =>
              daysInRange(e, r).filter((d) => d.date.getMonth() === month && d.date.getFullYear() === year),
            )
            const s = summarize(days)
            return [unit, monthName(year, month), people.length, s.worked, s.absent, s.leave, s.lateDays, percent(s.worked, s.worked + s.absent + s.leave)]
          }),
        ),
      }
    },
  },
  {
    id: 'edited-attendance',
    title: 'Edited Employee Attendance Details',
    description: 'View the attendance report that are edited on the selected period.',
    formats: ['pdf'],
    build: (r) => ({
      columns: ['Date', 'Employee ID', 'Name', 'Original Status', 'Edited Status', 'Edited By', 'Reason'],
      rows: active().flatMap((e) =>
        daysInRange(e, r)
          .filter((d) => (d.status === 'Absent' || d.status === 'Late') && rand(e.code, d.date.getTime(), 'edit') < 0.35)
          .map((d) => [
            fmtShortDate(d.date),
            e.code,
            e.name,
            statusLabel[d.status],
            'Present',
            'Aarav Sharma',
            d.status === 'Absent' ? 'Punch missed – device offline' : 'Late approved – client visit',
          ]),
      ),
    }),
  },
  {
    id: 'employee-status',
    title: 'Employee Status Report',
    description:
      'View employees attendance details in a Unit. Report includes day wise attendance details with Service and Designation grouped, employee attendance percentage, shift worked. Report can be generated billing cycle wise. Summary of total worked man-days, Overall attendance percentage, Total absent days, Total leave days can be viewed.',
    formats: ['excel'],
    build: (r) => ({
      columns: ['Employee ID', 'Name', 'Service', 'Designation', 'Status', 'Face Enrolled', 'Mobile App', 'Web App', 'Attendance %'],
      rows: employees.map((e) => {
        const s = summarize(daysInRange(e, r))
        return [
          e.code,
          e.name,
          e.service,
          e.designation,
          e.relieved ? 'Relieved' : 'Active',
          e.faceEnrolled ? 'Yes' : 'No',
          e.mobile ? 'Yes' : 'No',
          e.web ? 'Yes' : 'No',
          percent(s.worked, s.worked + s.absent + s.leave),
        ]
      }),
    }),
  },
  {
    id: 'employee-details',
    title: 'Employee Details Report',
    description: 'Download employees basic informations based on unit or project',
    formats: ['excel'],
    build: () => ({
      columns: ['Project', 'Unit', 'Employee ID', 'Name', 'Gender', 'Designation', 'Service', 'Employment Type', 'Email'],
      rows: employees.map((e) => [
        PROJECT,
        unitOf(e),
        e.code,
        e.name,
        e.gender,
        e.designation,
        e.service,
        e.employmentType,
        contactOf(e).email,
      ]),
    }),
  },
  {
    id: 'detailed-punch',
    title: 'Detailed Punch Report',
    description: 'View detailed employees punch report',
    formats: ['excel'],
    build: (r) => ({
      columns: ['Date', 'Employee ID', 'Name', 'Punch', 'Time', 'Unit', 'Mode'],
      rows: active().flatMap((e) =>
        daysInRange(e, r).flatMap((d) => {
          const mode = e.web && rand(e.code, d.date.getTime(), 'mode') < 0.3 ? 'Web' : 'Mobile'
          const punches: (string | number)[][] = []
          if (d.inMinutes !== undefined) punches.push([fmtShortDate(d.date), e.code, e.name, 'In', fmtTime(d.inMinutes), unitOf(e), mode])
          if (d.outMinutes !== undefined) punches.push([fmtShortDate(d.date), e.code, e.name, 'Out', fmtTime(d.outMinutes), unitOf(e), mode])
          return punches
        }),
      ),
    }),
  },
  {
    id: 'project-unit-attendance',
    title: 'Project Unit Wise Attendance Report',
    description: 'View the attendance report project and unit wise with leave codes for the selected period.',
    formats: ['excel'],
    build: (r) => {
      const dates = daysInRange(employees[0], r).map((d) => d.date)
      return {
        columns: ['Project', 'Unit', 'Employee ID', 'Name', ...dates.map((d) => `${d.getDate()}/${d.getMonth() + 1}`)],
        rows: active().map((e) => {
          const byDate = new Map(daysInRange(e, r).map((d) => [d.date.getTime(), d]))
          return [
            PROJECT,
            unitOf(e),
            e.code,
            e.name,
            ...dates.map((d) => {
              const day = byDate.get(d.getTime())
              if (!day) return '-'
              return day.status === 'Leave' ? (day.leaveType ?? 'L').split(' ').map((w) => w[0]).join('') : statusCode[day.status]
            }),
          ]
        }),
      }
    },
  },
  {
    id: 'project-unit-leave',
    title: 'Project Unit Wise Leave Report',
    description: 'View the leave report project and unit wise for the selected period.',
    formats: ['excel'],
    build: (r) => ({
      columns: ['Project', 'Unit', 'Employee ID', 'Name', 'Leave Date', 'Leave Type', 'Duration', 'Status'],
      rows: active().flatMap((e) =>
        daysInRange(e, r)
          .filter((d) => d.status === 'Leave')
          .map((d) => [PROJECT, unitOf(e), e.code, e.name, fmtShortDate(d.date), d.leaveType ?? 'Leave', 'Full Day', 'Approved']),
      ),
    }),
  },
  {
    id: 'project-unit-leave-balance',
    title: 'Project Unit Wise Leave Balance Report',
    description: 'View the leave balance report project and unit wise for the selected period.',
    formats: ['excel'],
    build: (r) => {
      const types = Object.keys(LEAVE_ALLOWANCE) as LeaveType[]
      return {
        columns: ['Project', 'Unit', 'Employee ID', 'Name', ...types.flatMap((t) => [`${t} Taken`, `${t} Balance`])],
        rows: active().map((e) => {
          const leaves = daysInRange(e, r).filter((d) => d.status === 'Leave')
          return [
            PROJECT,
            unitOf(e),
            e.code,
            e.name,
            ...types.flatMap((t) => {
              const used = leaves.filter((l) => l.leaveType === t).length
              return [used, Math.max(0, LEAVE_ALLOWANCE[t] - used)]
            }),
          ]
        }),
      }
    },
  },
]

// ---- Export ----

const fileStamp = (r: ReportRange) => {
  const iso = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `${iso(r.from)}-${iso(r.to)}`
}

const csvCell = (v: string | number) => {
  const s = String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadExcel(report: ReportDefinition, table: ReportTable, range: ReportRange) {
  const lines = [
    [report.title],
    [`Period: ${fmtShortDate(range.from)} - ${fmtShortDate(range.to)}`],
    [],
    table.columns,
    ...table.rows,
  ].map((row) => row.map(csvCell).join(','))
  // BOM so Excel opens the UTF-8 file (₹, names) correctly
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${report.id}-${fileStamp(range)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

const escapeHtml = (v: string | number) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

export function openPdf(report: ReportDefinition, table: ReportTable, range: ReportRange) {
  const win = window.open('', '_blank')
  if (!win) return false
  const head = table.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')
  const body = table.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')
  win.document.write(`<!doctype html><html><head><title>${escapeHtml(report.title)}</title>
<style>
@page{size:A4 landscape;margin:12mm}
body{font-family:Roboto,Arial,sans-serif;color:#222;font-size:11px;margin:24px}
h1{font-size:18px;margin:0 0 2px}.muted{color:#666;margin-bottom:14px}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 6px;text-align:left}
th{background:#f3f5f8;font-weight:600}tr:nth-child(even) td{background:#fafbfc}
</style></head><body>
<h1>${escapeHtml(report.title)}</h1>
<div class="muted">Logface · ${escapeHtml(fmtShortDate(range.from))} - ${escapeHtml(fmtShortDate(range.to))} · ${table.rows.length} rows</div>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`)
  win.document.close()
  win.focus()
  win.print()
  return true
}
