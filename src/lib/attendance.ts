import type { Employee } from '../data/employees'

// TODO: replace generated mock attendance with API responses

export type DayStatus = 'Present' | 'Late' | 'Absent' | 'Leave' | 'Weekoff' | 'Holiday' | 'NotPunched'

export type DayRecord = {
  date: Date
  status: DayStatus
  holidayName?: string
  inMinutes?: number // minutes after midnight
  outMinutes?: number
  lateMinutes?: number
  otMinutes?: number
  leaveType?: LeaveType
}

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Earned Leave'

export const SHIFT = { name: 'General Shift', start: 9 * 60 + 30, end: 18 * 60 + 30 }
const STANDARD_WORK = 9 * 60

// Records start from this month (before it there's no data)
export const ATTENDANCE_START = new Date(2025, 0, 1)

const publicHolidays: Record<string, string> = {
  '2025-01-26': 'Republic Day',
  '2025-03-14': 'Holi',
  '2025-05-01': 'May Day',
  '2025-08-15': 'Independence Day',
  '2025-10-02': 'Gandhi Jayanti',
  '2025-10-20': 'Diwali',
  '2025-12-25': 'Christmas',
  '2026-01-26': 'Republic Day',
  '2026-03-04': 'Holi',
  '2026-04-03': 'Good Friday',
  '2026-05-01': 'May Day',
  '2026-08-15': 'Independence Day',
  '2026-10-02': 'Gandhi Jayanti',
  '2026-11-09': 'Diwali',
  '2026-12-25': 'Christmas',
}

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Deterministic pseudo-random number in [0, 1) so each employee/day is stable across renders
export function rand(...parts: (string | number)[]) {
  let h = 2166136261
  for (const ch of parts.join('|')) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 13
  h = Math.imul(h, 0x5bd1e995)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

const leaveTypes: LeaveType[] = ['Casual Leave', 'Sick Leave', 'Earned Leave']

function dayRecord(e: Employee, date: Date, today: Date): DayRecord {
  const key = isoDay(date)
  const holiday = publicHolidays[key]
  if (holiday) return { date, status: 'Holiday', holidayName: holiday }
  const dow = date.getDay()
  if (dow === 0 || dow === 6) return { date, status: 'Weekoff' }

  const r = rand(e.code, key)
  const isToday = date.getTime() === today.getTime()
  if (r < 0.06) return { date, status: 'Absent' }
  if (r < 0.1) return { date, status: 'Leave', leaveType: leaveTypes[Math.floor(rand(e.code, key, 'lt') * 3)] }

  const late = r < 0.3
  const inMinutes = late
    ? SHIFT.start + 1 + Math.floor(rand(e.code, key, 'in') * 45)
    : SHIFT.start - 45 + Math.floor(rand(e.code, key, 'in') * 45)
  const lateMinutes = late ? inMinutes - SHIFT.start : 0

  if (isToday) {
    if (rand(e.code, key, 'today') < 0.35) return { date, status: 'NotPunched' }
    return { date, status: late ? 'Late' : 'Present', inMinutes, lateMinutes }
  }

  const outMinutes = SHIFT.end - 20 + Math.floor(rand(e.code, key, 'out') * 110)
  const worked = outMinutes - inMinutes
  return {
    date,
    status: late ? 'Late' : 'Present',
    inMinutes,
    outMinutes,
    lateMinutes,
    otMinutes: Math.max(0, worked - STANDARD_WORK - 30),
  }
}

// Days of the month up to today (newest first)
export function monthAttendance(e: Employee, year: number, month: number, today: Date): DayRecord[] {
  const last = new Date(year, month + 1, 0).getDate()
  const days: DayRecord[] = []
  for (let d = last; d >= 1; d--) {
    const date = new Date(year, month, d)
    if (date > today || date < ATTENDANCE_START) continue
    days.push(dayRecord(e, date, today))
  }
  return days
}

export function summarize(days: DayRecord[]) {
  const count = (...s: DayStatus[]) => days.filter((d) => s.includes(d.status)).length
  const otDays = days.filter((d) => (d.otMinutes ?? 0) > 0)
  return {
    worked: count('Present', 'Late'),
    absent: count('Absent'),
    leave: count('Leave'),
    weekoff: count('Weekoff', 'Holiday'),
    otDays: otDays.length,
    otMinutes: otDays.reduce((t, d) => t + (d.otMinutes ?? 0), 0),
    lateDays: count('Late'),
    lateMinutes: days.reduce((t, d) => t + (d.lateMinutes ?? 0), 0),
  }
}

export const fmtTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const fmtDuration = (minutes: number) => {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`
}
