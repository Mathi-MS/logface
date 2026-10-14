import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import Avatar from '../components/Avatar'

// TODO: replace mock data with API responses
const company = { name: 'ABC Private Limited', activeEmployees: 21 }

const COLORS = {
  onTime: '#0b8ee6',
  late: '#3fd6f8',
  nonWorking: '#fbb32d',
  yetToPresent: '#dcdcdc',
  chartOnTime: '#34a3e8',
  chartLate: '#64def9',
}

const attendance = { onTime: 6, late: 8, nonWorking: 0, yetToPresent: 7 }

type Punch = { name: string; female?: boolean; role: string; time: string; shift: string; lateBy?: string }

const recentPunches: Punch[] = [
  { name: 'Rahul Desai', role: 'Project Manager', time: '09:39 AM', shift: 'General Shift', lateBy: '39m' },
  { name: 'Ananya Iyer', female: true, role: 'UI/UX Designer', time: '09:20 AM', shift: 'General Shift' },
  { name: 'Karan Mehta', role: 'Frontend Developer', time: '09:15 AM', shift: 'General Shift' },
  { name: 'Kavya Menon', female: true, role: 'QA Analyst', time: '09:14 AM', shift: 'General Shift' },
  { name: 'Arjun Reddy', role: 'Backend Developer', time: '09:12 AM', shift: 'General Shift' },
  { name: 'Sneha Kulkarni', female: true, role: 'Sales Executive', time: '09:08 AM', shift: 'General Shift' },
  { name: 'Manoj Pillai', role: 'Accountant', time: '09:05 AM', shift: 'General Shift' },
]

type DayCount = { late: number; onTime: number }

// [late, onTime] per day of month
const toDays = (pairs: [number, number][], daysInMonth: number): DayCount[] =>
  Array.from({ length: daysInMonth }, (_, i) => {
    const [late, onTime] = pairs[i] ?? [0, 0]
    return { late, onTime }
  })

const months: { key: string; label: string; days: DayCount[] }[] = [
  {
    key: 'aug',
    label: 'Aug',
    days: toDays(
      [[4, 8], [5, 9], [0, 0], [3, 10], [6, 7], [5, 8], [2, 11], [0, 0], [0, 1], [7, 6], [4, 9], [3, 10], [6, 8], [5, 9], [0, 2], [0, 0], [0, 0], [4, 10], [6, 7], [3, 9], [5, 8], [7, 6], [0, 1], [0, 0], [3, 11], [4, 9], [6, 6], [2, 12], [5, 7], [0, 1], [0, 0]],
      31,
    ),
  },
  {
    key: 'sep',
    label: 'Sep',
    days: toDays(
      [[5, 7], [3, 10], [4, 9], [6, 8], [2, 10], [0, 1], [0, 0], [5, 8], [7, 6], [4, 9], [3, 11], [6, 7], [0, 2], [0, 0], [4, 10], [5, 8], [3, 9], [0, 0], [6, 7], [0, 1], [0, 0], [4, 9], [5, 9], [3, 10], [6, 8], [2, 11], [0, 0], [0, 0], [5, 8], [4, 10]],
      30,
    ),
  },
  {
    key: 'oct',
    label: 'Oct',
    days: toDays(
      [[3, 5], [0, 0], [0, 1], [0, 0], [5, 3], [7, 4], [6, 4], [8, 3], [2, 8], [0, 1], [0, 0], [6, 6], [3, 6], [8, 6]],
      31,
    ),
  },
]

function Card({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={clsx('border border-[#d6d6d6] bg-white', className)}>
      <h2 className="text-[16px] text-[#333]">{title}</h2>
      {children}
    </section>
  )
}

function TodaysAttendance() {
  const total = attendance.onTime + attendance.late + attendance.nonWorking + attendance.yetToPresent
  const present = attendance.onTime + attendance.late
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  const rows = [
    { label: 'On Time Present', value: attendance.onTime, color: COLORS.onTime },
    { label: 'Late Entry', value: attendance.late, color: COLORS.late },
    { label: 'Non-Working', value: attendance.nonWorking, color: COLORS.nonWorking },
    { label: 'Yet To Present', value: attendance.yetToPresent, color: COLORS.yetToPresent },
  ]
  const barSegments = rows.slice(0, 3)

  return (
    <Card title="Today's Attendance" className="px-5 pb-8 pt-6">
      <div className="mt-6 flex items-end justify-between">
        <div className="text-[#1e88e5]">
          <div className="text-[18px] leading-tight">{present}</div>
          <div className="text-[14px]">Present</div>
        </div>
        <div className="text-right text-[#333]">
          <div className="text-[18px] leading-tight">{total}</div>
          <div className="text-[14px]">Total</div>
        </div>
      </div>

      <div className="mt-3 flex h-[22px] overflow-hidden rounded-full" style={{ backgroundColor: COLORS.yetToPresent }}>
        {barSegments.map((s, i) => (
          <div
            key={s.label}
            className={clsx('h-full transition-[width] duration-500', i === 0 && 'rounded-l-full')}
            style={{ width: `${(s.value / (total || 1)) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>

      <ul className="mt-10 space-y-[18px] px-3">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between">
            <span className="flex items-center gap-6 text-[14px] text-[#222]">
              <span className="h-[20px] w-[20px] rounded" style={{ backgroundColor: r.color }} />
              {r.label}
            </span>
            <span className="text-[14px] text-[#222]">
              {r.value} <span className="text-sm">({pct(r.value)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function RecentPunches() {
  return (
    <Card title="Recent Punches" className="flex flex-col pb-4 pl-5 pr-3 pt-6">
      <ul className="mt-5 max-h-[340px] flex-1 overflow-y-auto pr-5">
        {recentPunches.map((p) => (
          <li key={p.name} className="flex items-center gap-3 py-0">
            <Avatar variant={p.female ? 'female' : 'male'} className="h-[42px] w-[42px] self-center" />
            <div className="flex flex-1 items-center justify-between border-b border-[#e5e5e5] py-4">
              <div>
                <div className="text-[14px] text-[#222]">{p.name}</div>
                <div className="text-[13px] text-[#888]">{p.role}</div>
              </div>
              <div className="text-right">
                <div className="text-[14px] text-[#222]">{p.time}</div>
                <div className="text-[13px] text-[#888]">
                  {p.lateBy && <span className="text-[#e53935]">{p.lateBy} late . </span>}
                  {p.shift}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function MonthChart({ days }: { days: DayCount[] }) {
  const maxTotal = Math.max(...days.map((d) => d.late + d.onTime), 2)
  const yMax = Math.ceil(maxTotal / 2) * 2
  const ticks = Array.from({ length: yMax / 2 + 1 }, (_, i) => i * 2)

  const W = 1400
  const H = 380
  const pad = { left: 40, right: 10, top: 10, bottom: 40 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const slot = plotW / days.length
  const barW = Math.min(20, slot * 0.45)
  const y = (v: number) => pad.top + plotH - (v / yMax) * plotH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[720px]" role="img" aria-label="Daily attendance">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left - 6} x2={pad.left} y1={y(t)} y2={y(t)} stroke="#ccc" />
          <text x={pad.left - 12} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="15" fill="#555">
            {t}
          </text>
        </g>
      ))}
      <line x1={pad.left} x2={pad.left} y1={pad.top} y2={pad.top + plotH} stroke="#ddd" />
      <line x1={pad.left} x2={W - pad.right} y1={pad.top + plotH} y2={pad.top + plotH} stroke="#ccc" />

      {days.map((d, i) => {
        const cx = pad.left + slot * i + slot / 2
        const x = cx - barW / 2
        return (
          <g key={i}>
            <title>{`Day ${i + 1} — Late: ${d.late}, On time: ${d.onTime}`}</title>
            <line x1={pad.left + slot * (i + 1)} x2={pad.left + slot * (i + 1)} y1={pad.top + plotH} y2={pad.top + plotH + 6} stroke="#ccc" />
            {d.late > 0 && <rect x={x} y={y(d.late)} width={barW} height={y(0) - y(d.late)} fill={COLORS.chartLate} />}
            {d.onTime > 0 && (
              <rect x={x} y={y(d.late + d.onTime)} width={barW} height={y(d.late) - y(d.late + d.onTime)} fill={COLORS.chartOnTime} />
            )}
            <text x={cx} y={pad.top + plotH + 24} textAnchor="middle" fontSize="15" fill="#555">
              {i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function AttendanceMonthView() {
  const [monthKey, setMonthKey] = useState(months[months.length - 1].key)
  const month = months.find((m) => m.key === monthKey) ?? months[0]

  return (
    <section className="mt-5 border border-[#d6d6d6] bg-white px-8 pb-8 pt-6 max-sm:px-4">
      <div className="flex items-start justify-between gap-4">
        <h2 className="pt-4 text-[16px] text-[#333]">Attendance Month View</h2>
        <div className="flex gap-1.5">
          {months.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMonthKey(m.key)}
              className={clsx(
                'h-[32px] rounded px-3 text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-colors',
                m.key === monthKey ? 'bg-[#3fd6f8] text-white' : 'bg-white text-[#555] hover:bg-[#f5f6fa]',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 overflow-x-auto">
        <MonthChart days={month.days} />
      </div>

      <div className="mt-2 flex justify-end gap-4 text-[14px] text-[#333]">
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4" style={{ backgroundColor: COLORS.chartLate }} /> Late Entry
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4" style={{ backgroundColor: COLORS.onTime }} /> On Time Present
        </span>
      </div>
    </section>
  )
}

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-[17px] font-medium text-[#222]">{company.name}</h1>
      <p className="text-[13px] text-[#777]">{company.activeEmployees} Active Employees</p>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <TodaysAttendance />
        <RecentPunches />
      </div>

      <AttendanceMonthView />
    </div>
  )
}
