import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  CalendarX,
  Check,
  ChevronDown,
  CirclePlus,
  CircleX,
  Clock,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plane,
  Plus,
  Umbrella,
  UserRound,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import MonthPicker from '../components/MonthPicker'
import { contactOf, employees, type Employee } from '../data/employees'
import {
  fmtDuration,
  fmtTime,
  monthAttendance,
  summarize,
  type DayRecord,
  type DayStatus,
  type LeaveType,
} from '../lib/attendance'
import { fmtShortDate, releasedMonths } from '../lib/payroll'
import { PayslipView } from './PayslipDetail'

const TABS = ['Attendance', 'Information', 'Permissions', 'Leave', 'Payroll'] as const
type Tab = (typeof TABS)[number]

// Full-width white band inside the centred layout container
const fullBleedWhite = 'bg-white [box-shadow:0_0_0_100vmax_#fff] [clip-path:inset(0_-100vmax)]'
const panel = 'border border-[#d6d6d6] bg-white'

// ---- Status visuals ----

const statusMeta: Record<DayStatus, { label: string; color: string; chip: string }> = {
  Present: { label: 'Present', color: '#16a34a', chip: 'bg-[#e7f8ef] text-[#15803d]' },
  Late: { label: 'Late Entry', color: '#f59e0b', chip: 'bg-[#fff4e5] text-[#c2410c]' },
  Absent: { label: 'Absent', color: '#dc2626', chip: 'bg-[#fdecec] text-[#b91c1c]' },
  Leave: { label: 'Leave', color: '#7c3aed', chip: 'bg-[#f3eefe] text-[#6d28d9]' },
  Weekoff: { label: 'Weekoff', color: '#06b6d4', chip: 'bg-[#e6f9fc] text-[#0e7490]' },
  Holiday: { label: 'Holiday', color: '#0ea5e9', chip: 'bg-[#e6f4fd] text-[#0369a1]' },
  NotPunched: { label: 'Not yet punched', color: '#94a3b8', chip: 'bg-[#f1f5f9] text-[#64748b]' },
}

function StatusIcon({ status, size = 72 }: { status: DayStatus; size?: number }) {
  const main = '#1e5fa8'
  const accent = '#22c5ee'
  const badge = (Icon: LucideIcon, color: string) => (
    <span className="absolute -bottom-1 -right-2 rounded-md bg-white">
      <Icon style={{ width: size * 0.42, height: size * 0.42 }} color={color} strokeWidth={2} />
    </span>
  )
  const box = (children: ReactNode) => (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      {children}
    </span>
  )
  const big = (Icon: LucideIcon, color = main) => (
    <Icon style={{ width: size * 0.8, height: size * 0.8 }} color={color} strokeWidth={1.4} />
  )

  switch (status) {
    case 'Present':
      return box(<>{big(UserRound)}{badge(CalendarCheck, '#16a34a')}</>)
    case 'Late':
      return box(<>{big(UserRound)}{badge(Clock, '#f59e0b')}</>)
    case 'Absent':
      return box(<>{big(UserRound)}{badge(CalendarX, '#dc2626')}</>)
    case 'Leave':
      return box(<>{big(CalendarOff)}{badge(Plane, '#7c3aed')}</>)
    case 'NotPunched':
      return box(<>{big(CalendarDays)}{badge(MapPin, accent)}</>)
    default:
      return box(
        <>
          {big(Umbrella)}
          <Waves className="absolute -bottom-1 left-0" style={{ width: size * 0.8, height: size * 0.35 }} color={accent} strokeWidth={1.6} />
        </>,
      )
  }
}

function dayCaption(d: DayRecord) {
  if (d.status === 'Holiday') return d.holidayName ?? 'Holiday'
  if (d.status === 'Leave') return d.leaveType
  return undefined
}

// ---- Attendance views ----

function DayCard({ day }: { day: DayRecord }) {
  const meta = statusMeta[day.status]
  const caption = dayCaption(day)
  return (
    <article className={clsx(panel, 'flex h-[250px] flex-col items-center px-4 pb-4 pt-4 text-center')}>
      <h3 className="text-[14px] font-medium text-[#1565c0]">{fmtShortDate(day.date)}</h3>
      <div className="flex flex-1 flex-col items-center justify-center">
        <StatusIcon status={day.status} />
        <div className="mt-3 text-[13px] text-[#666]">{meta.label}</div>
        {caption && <div className="text-[12px] text-[#888]">{caption}</div>}
      </div>
      {day.inMinutes !== undefined && (
        <div className="w-full border-t border-[#eef0f3] pt-2.5 text-[12px] text-[#555]">
          <div className="flex justify-between">
            <span>In {fmtTime(day.inMinutes)}</span>
            <span>Out {day.outMinutes !== undefined ? fmtTime(day.outMinutes) : '--'}</span>
          </div>
          {!!day.lateMinutes && <div className="mt-0.5 text-[#dc2626]">{fmtDuration(day.lateMinutes)} late</div>}
          {!!day.otMinutes && <div className="mt-0.5 text-[#15803d]">OT {fmtDuration(day.otMinutes)}</div>}
        </div>
      )}
    </article>
  )
}

function PunchPhoto({ employee, label, minutes }: { employee: Employee; label: string; minutes?: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-[92px] w-[92px] items-center justify-center rounded-md border border-[#e5e7eb] bg-[#f3f7fc]">
        {minutes !== undefined ? (
          <Avatar variant={employee.gender === 'Female' ? 'female' : 'male'} className="h-16 w-16" />
        ) : (
          <ImageIcon className="h-7 w-7 text-[#cbd5e1]" />
        )}
      </div>
      <span className="text-[11.5px] text-[#555]">
        {label} {minutes !== undefined ? fmtTime(minutes) : '--'}
      </span>
    </div>
  )
}

function ImageCard({ day, employee }: { day: DayRecord; employee: Employee }) {
  const punched = day.inMinutes !== undefined
  return (
    <article className={clsx(panel, 'flex h-[250px] flex-col items-center px-4 pb-4 pt-4 text-center')}>
      <h3 className="text-[14px] font-medium text-[#1565c0]">{fmtShortDate(day.date)}</h3>
      {punched ? (
        <div className="flex flex-1 items-center gap-4">
          <PunchPhoto employee={employee} label="In" minutes={day.inMinutes} />
          <PunchPhoto employee={employee} label="Out" minutes={day.outMinutes} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center">
          <StatusIcon status={day.status} size={56} />
          <div className="mt-3 text-[13px] text-[#666]">{statusMeta[day.status].label}</div>
          <div className="text-[12px] text-[#9ca3af]">No punch photos</div>
        </div>
      )}
    </article>
  )
}

function MonthGrid({ year, month, days }: { year: number; month: number; days: DayRecord[] }) {
  const byDay = new Map(days.map((d) => [d.date.getDate(), d]))
  const blanks = new Date(year, month, 1).getDay()
  const count = new Date(year, month + 1, 0).getDate()
  const legend = (Object.keys(statusMeta) as DayStatus[]).filter((s) => days.some((d) => d.status === s))

  return (
    <div className={clsx(panel, 'p-4')}>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[12px] font-medium text-[#555]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <div key={`b${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const day = byDay.get(i + 1)
          const meta = day && statusMeta[day.status]
          return (
            <div
              key={i}
              title={day ? `${fmtShortDate(day.date)} – ${meta?.label}${dayCaption(day) ? ` (${dayCaption(day)})` : ''}` : undefined}
              className={clsx(
                'flex h-[74px] flex-col items-start rounded-md border p-1.5 text-left',
                day ? 'border-[#e5e7eb] bg-white' : 'border-dashed border-[#eef0f3] bg-[#fafbfc] text-[#c0c6cf]',
              )}
            >
              <span className="text-[12.5px] font-medium text-[#333]">{i + 1}</span>
              {day && meta && (
                <>
                  <span className={clsx('mt-1 truncate rounded px-1.5 py-0.5 text-[10.5px] font-medium', meta.chip)}>{meta.label}</span>
                  {day.inMinutes !== undefined && <span className="mt-auto text-[10.5px] text-[#777]">{fmtTime(day.inMinutes)}</span>}
                </>
              )}
            </div>
          )
        })}
      </div>
      {!!legend.length && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-[#555]">
          {legend.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusMeta[s].color }} />
              {statusMeta[s].label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div className="flex items-center justify-between border-t border-[#e5e5e5] px-3 py-3">
      <span className="text-[13.5px] text-[#333]">{label}</span>
      <span className="text-right leading-none">
        <span className="block text-[17px] text-[#222]">{value}</span>
        {unit && <span className="text-[9.5px] text-[#9ca3af]">{unit}</span>}
      </span>
    </div>
  )
}

type View = 'card' | 'image' | 'month'
const views: { key: View; label: string; icon: LucideIcon }[] = [
  { key: 'card', label: 'Card view', icon: MapPin },
  { key: 'image', label: 'Image view', icon: ImageIcon },
  { key: 'month', label: 'Month view', icon: CalendarDays },
]

const plural = (n: number) => (n === 1 ? 'Day' : 'Days')
const monthYearLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })

function AttendanceTab({ employee, today }: { employee: Employee; today: Date }) {
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [view, setView] = useState<View>('card')

  const days = useMemo(() => monthAttendance(employee, year, month, today), [employee, year, month, today])
  const sum = summarize(days)
  const monthLabel = monthYearLabel(year, month)
  const select = (y: number, m: number) => {
    setYear(y)
    setMonth(m)
  }

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[210px_minmax(0,1fr)_96px]">
      <aside className={clsx(panel, 'lg:sticky lg:top-[120px]')}>
        <h2 className="px-3 py-3.5 text-[14.5px] font-medium text-[#1565c0]">Work Summary</h2>
        <SummaryRow label="Worked Days" value={sum.worked} unit={plural(sum.worked)} />
        <SummaryRow label="Absent Days" value={sum.absent} unit={plural(sum.absent)} />
        <SummaryRow label="Leave Days" value={sum.leave} unit={plural(sum.leave)} />
        <SummaryRow label="Weekoff Days" value={sum.weekoff} unit={plural(sum.weekoff)} />
        <SummaryRow label="OT Days" value={sum.otDays} unit={plural(sum.otDays)} />
        <SummaryRow label="OT Hours" value={sum.otMinutes ? fmtDuration(sum.otMinutes) : '-'} />
        <SummaryRow label="Late Days" value={sum.lateDays} unit={plural(sum.lateDays)} />
        <SummaryRow label="Late Hours" value={fmtDuration(sum.lateMinutes)} />
      </aside>

      <section className="min-w-0">
        <div className={clsx(panel, 'flex flex-wrap gap-x-10 gap-y-2 px-6 py-3.5')} role="tablist" aria-label="Attendance view">
          {views.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={clsx(
                'flex items-center gap-1.5 text-[15px] transition-colors',
                view === key ? 'font-medium text-[#1565c0]' : 'text-[#9ca3af] hover:text-[#555]',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <h2 className="my-4 text-[15px] font-medium text-[#333]">Attendance details for month of {monthLabel}</h2>

        {!days.length ? (
          <div className={clsx(panel, 'px-6 py-14 text-center text-[13px] text-[#888]')}>No attendance records for this month.</div>
        ) : view === 'month' ? (
          <MonthGrid year={year} month={month} days={days} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {days.map((d) =>
              view === 'card' ? (
                <DayCard key={d.date.getTime()} day={d} />
              ) : (
                <ImageCard key={d.date.getTime()} day={d} employee={employee} />
              ),
            )}
          </div>
        )}
      </section>

      <MonthPicker year={year} month={month} today={today} onChange={select} />
    </div>
  )
}

// ---- Other tabs ----

const isLead = (e: Employee) => /Lead|Manager|Head|Director/.test(e.designation)

// Stable mock profile details derived from the employee code
function profileDetails(e: Employee) {
  const n = Number(e.code.replace(/\D/g, '')) || 0
  const joining = new Date(2023 + (n % 3), (n * 5) % 12, 1 + ((n * 7) % 27))
  const onboarded = new Date(2026, 8, 1 + (n % 28))
  const reporting =
    employees.find((x) => x.code !== e.code && x.service === e.service && isLead(x)) ??
    employees.find((x) => x.code !== e.code && isLead(x))
  return {
    project: 'ABC',
    unit: e.unit ?? 'Puducherry',
    joining,
    onboarded,
    reporting: reporting?.name ?? 'NA',
    mobile: contactOf(e).mobile,
    email: contactOf(e).email,
  }
}

const longDate = (d: Date) => d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

type EnrollPhoto = { id: string; url?: string } // no url = mock enrolled face

function PhotoFrame({ children, onRemove, label }: { children: ReactNode; onRemove?: () => void; label: string }) {
  return (
    <div className="group relative aspect-square bg-white p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.25)]">
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="absolute right-2.5 top-2.5 rounded-full bg-black/55 p-1 text-white opacity-0 transition-opacity hover:bg-black/75 focus:opacity-100 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function UnderlineField({
  label,
  value,
  onChange,
  editing,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  editing: boolean
  type?: string
}) {
  return (
    <label className="relative block pt-4">
      <input
        type={type}
        value={value}
        placeholder=" "
        readOnly={!editing}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'peer block w-full border-0 border-b bg-transparent pb-1.5 pt-0.5 text-[14.5px] text-[#222] outline-none',
          editing ? 'border-[#1976d2] focus:border-b-2' : 'border-[#8a8a8a]',
        )}
      />
      <span className="pointer-events-none absolute left-0 top-0 text-[11px] text-[#666] transition-all peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[14.5px] peer-focus:top-0 peer-focus:text-[11px]">
        {label}
      </span>
    </label>
  )
}

function InformationTab({ employee }: { employee: Employee }) {
  const details = useMemo(() => profileDetails(employee), [employee])
  const [contact, setContact] = useState({ mobile: details.mobile, alternate: '', email: details.email })
  const [draft, setDraft] = useState(contact)
  const [editing, setEditing] = useState(false)
  const [photos, setPhotos] = useState<EnrollPhoto[]>(() =>
    employee.faceEnrolled ? Array.from({ length: 10 }, (_, i) => ({ id: `enrolled-${i}` })) : [],
  )
  const photoInput = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(contact)
    setEditing(true)
  }
  const save = () => {
    setContact(draft)
    setEditing(false)
  }

  const addPhotos = (files: FileList | null) => {
    const images = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'))
    setPhotos((p) => [...p, ...images.map((f) => ({ id: `${f.name}-${f.lastModified}-${Math.random()}`, url: URL.createObjectURL(f) }))])
  }
  const removePhoto = (id: string) =>
    setPhotos((p) => {
      const photo = p.find((x) => x.id === id)
      if (photo?.url) URL.revokeObjectURL(photo.url)
      return p.filter((x) => x.id !== id)
    })
  const removeAll = () => {
    if (!window.confirm(`Remove all ${photos.length} enrolled images for ${employee.name}?`)) return
    photos.forEach((p) => p.url && URL.revokeObjectURL(p.url))
    setPhotos([])
  }

  const rows: [string, string][] = [
    ['Project:', details.project],
    ['Unit:', details.unit],
    ['Service:', employee.service],
    ['Joining Date:', longDate(details.joining)],
    ['Onboarded on:', longDate(details.onboarded)],
    ['Reporting Person:', details.reporting],
  ]
  const shown = editing ? draft : contact

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
      <section className={clsx(panel, 'px-5 py-6 lg:sticky lg:top-[120px]')}>
        <div className="flex items-center gap-4">
          <Avatar variant={employee.gender === 'Female' ? 'female' : 'male'} className="h-[88px] w-[88px]" />
          <div className="min-w-0">
            <h2 className="truncate text-[19px] text-[#333]">{employee.name}</h2>
            <div className="text-[13px] text-[#555]">{employee.designation}</div>
            {!editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="mt-2 flex items-center gap-1.5 rounded border border-[#1976d2] px-2.5 py-1 text-[13px] text-[#1976d2] hover:bg-[#eef6ff]"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            ) : (
              <span className="mt-2 inline-block rounded bg-[#eef6ff] px-2 py-1 text-[12px] text-[#1565c0]">Editing contact details</span>
            )}
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-[100px_minmax(0,1fr)] gap-x-3 gap-y-3 text-[13px]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-medium text-[#222]">{k}</dt>
              <dd className="text-[#666]">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={clsx(panel, 'px-6 py-6')}>
        <h2 className="text-[19px] text-[#1565c0]">Contact Information</h2>
        <div className="mt-6 max-w-[520px] space-y-5">
          <UnderlineField
            label="Mobile Number"
            type="tel"
            value={shown.mobile}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, mobile: v.replace(/[^\d+ ]/g, '') }))}
          />
          <UnderlineField
            label="Alternate Mobile Number"
            type="tel"
            value={shown.alternate}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, alternate: v.replace(/[^\d+ ]/g, '') }))}
          />
          <UnderlineField
            label="Email ID"
            type="email"
            value={shown.email}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
          />
          {editing && (
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={save} className="h-8 rounded bg-[#1976d2] px-4 text-[13px] text-white hover:bg-[#1565c0]">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-8 rounded border border-[#d1d5db] px-4 text-[13px] text-[#333] hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <h2 className="text-[19px] text-[#1565c0]">
            Enroll Images <span className="text-[13px] text-[#888]">({photos.length})</span>
          </h2>
          <button
            type="button"
            disabled={!photos.length}
            onClick={removeAll}
            className="rounded border border-[#e53935] px-3 py-1.5 text-[13px] text-[#e53935] hover:bg-[#fdecec] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Remove all images
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo, i) => (
            <PhotoFrame key={photo.id} label={`image ${i + 1}`} onRemove={() => removePhoto(photo.id)}>
              {photo.url ? (
                <img src={photo.url} alt={`Enrolled face ${i + 1} of ${employee.name}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#d9cfc2] to-[#8c7b6a]">
                  <Avatar variant={employee.gender === 'Female' ? 'female' : 'male'} className="h-3/4 w-3/4" />
                </div>
              )}
            </PhotoFrame>
          ))}
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-3 bg-white text-[#777] shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition-colors hover:bg-[#f8fafc] hover:text-[#1976d2]"
          >
            <CirclePlus className="h-14 w-14" strokeWidth={1.2} />
            <span className="text-[14px]">Add a new photo</span>
          </button>
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addPhotos(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </section>
    </div>
  )
}

// Material-style switch (amber when on), as used in the Logface admin screens
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative flex h-6 w-10 shrink-0 items-center"
    >
      <span className={clsx('h-3.5 w-full rounded-full transition-colors', checked ? 'bg-[#fcd780]' : 'bg-[#9e9e9e]')} />
      <span
        className={clsx(
          'absolute h-5 w-5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-all',
          checked ? 'left-[20px] bg-[#fbb417]' : 'left-0 bg-[#fafafa]',
        )}
      />
    </button>
  )
}

type AttendanceType = 'regular' | 'roaming' | 'nounit'
type MobileMode = 'Single User' | 'Multi User' | 'Multi User Controller' | 'Kiosk'

const attendanceTypes: { key: AttendanceType; title: string; description: string }[] = [
  {
    key: 'regular',
    title: 'Regular/Single-Unit Employee',
    description:
      'Employee will be able to punch attendance only from the regular working unit. Single location/branch/site/unit working employees can be given this option.',
  },
  {
    key: 'roaming',
    title: 'Roaming/Multi-Unit Employee',
    description:
      'Employee will be able to punch attendance across all the mapped units. Multi-location visiting/supervising/patrolling/support employees can be given this option.',
  },
  {
    key: 'nounit',
    title: 'No Unit Employee',
    description:
      'In addition to the roaming option, the employee can punch from anywhere. For non-mapped units, the punched address will be shown. Suitable for sales/service/on-field employees.',
  },
]

const mobileModes: MobileMode[] = ['Single User', 'Multi User', 'Multi User Controller', 'Kiosk']
const roleOptions = ['Admin', 'Manager', 'HR', 'Payroll Admin', 'Employee', 'Viewer']
const allUnits = ['Puducherry', 'Chennai', 'Bengaluru', 'Coimbatore', 'Hyderabad']
const allServices = [...new Set(employees.map((e) => e.service))].sort()

function defaultPermissions(e: Employee) {
  const contact = contactOf(e)
  const lead = isLead(e)
  return {
    attendanceType: (e.unit ? 'regular' : 'nounit') as AttendanceType,
    mobile: e.mobile,
    mobileMode: (lead ? 'Multi User Controller' : 'Single User') as MobileMode,
    bypassQr: lead,
    reportingPerson: lead,
    travel: e.travel,
    web: e.web,
    email: contact.email,
    username: contact.username,
    roles: e.web ? (lead ? ['Admin', 'Manager'] : ['Employee']) : [],
    units: e.unit ? [e.unit] : ['Puducherry'],
    services: lead ? allServices : [e.service],
  }
}

function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[18px] text-[#1565c0]">{children}</h2>
      {action}
    </div>
  )
}

function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[12.5px] text-[#1565c0] underline underline-offset-2 hover:text-[#0d47a1]">
      {children}
    </button>
  )
}

function UnderlineInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] text-[#666]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full border-0 border-b border-[#8a8a8a] bg-transparent pb-1 pt-0.5 text-[14px] text-[#222] outline-none focus:border-b-2 focus:border-[#1565c0]"
      />
    </label>
  )
}

// Editable list with a picker for adding items (used for data units and services)
function AccessList({
  items,
  options,
  editing,
  onChange,
  removeIcon,
}: {
  items: string[]
  options: string[]
  editing: boolean
  onChange: (items: string[]) => void
  removeIcon: LucideIcon
}) {
  const RemoveIcon = removeIcon
  const available = options.filter((o) => !items.includes(o))
  return (
    <div>
      <ul className="max-h-[200px] overflow-y-auto">
        {items.map((item) => (
          <li key={item} className="flex items-center justify-between border-b border-[#e5e5e5] px-3 py-2.5 text-[14px] text-[#222] last:border-0">
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(items.filter((i) => i !== item))}
              className="rounded-full p-0.5 text-[#333] hover:bg-[#f3f4f6]"
            >
              <RemoveIcon className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </li>
        ))}
        {!items.length && <li className="px-3 py-3 text-[13px] text-[#9ca3af]">Nothing assigned.</li>}
      </ul>
      {editing && (
        <div className="mt-3 rounded-md border border-dashed border-[#c7d2e0] bg-[#f8fafc] p-3">
          {available.length ? (
            <div className="flex flex-wrap gap-2">
              {available.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => onChange([...items, o])}
                  className="flex items-center gap-1 rounded-full border border-[#1976d2] bg-white px-3 py-1 text-[12.5px] text-[#1976d2] hover:bg-[#eef6ff]"
                >
                  <Plus className="h-3.5 w-3.5" /> {o}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-[#888]">All options are already assigned.</p>
          )}
        </div>
      )}
    </div>
  )
}

function PermissionsTab({ employee }: { employee: Employee }) {
  const [p, setP] = useState(() => defaultPermissions(employee))
  const [editingUnits, setEditingUnits] = useState(false)
  const [editingServices, setEditingServices] = useState(false)
  const set = <K extends keyof typeof p>(key: K, value: (typeof p)[K]) => setP((prev) => ({ ...prev, [key]: value }))

  const toggles: { key: 'bypassQr' | 'reportingPerson' | 'travel' | 'web'; label: string }[] = [
    { key: 'bypassQr', label: 'Bypass Smart QR units' },
    { key: 'reportingPerson', label: 'Is Reporting Person' },
    { key: 'travel', label: 'Travel Management' },
    { key: 'web', label: 'Web Application' },
  ]

  return (
    <div className="space-y-4">
      <section className={panel}>
        <h2 className="border-b border-[#e5e5e5] px-5 py-4 text-[18px] text-[#444]">Attendance Type</h2>
        <div className="grid gap-3 p-4 md:grid-cols-3" role="radiogroup" aria-label="Attendance type">
          {attendanceTypes.map((t) => {
            const selected = p.attendanceType === t.key
            return (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => set('attendanceType', t.key)}
                className={clsx(
                  'flex flex-col border p-4 text-left transition-colors',
                  selected ? 'border-[#b7e4a0] bg-[#dcf8c9]' : 'border-[#d6d6d6] bg-white hover:bg-[#fafafa]',
                )}
              >
                <span className="flex items-center gap-2.5 text-[15px] text-[#222]">
                  <span
                    className={clsx(
                      'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border-2',
                      selected ? 'border-[#22a861] bg-[#22a861] text-white' : 'border-[#666] bg-white',
                    )}
                  >
                    {selected && <Check className="h-3 w-3" strokeWidth={3.5} />}
                  </span>
                  {t.title}
                </span>
                <span className="mt-4 text-[13.5px] leading-[1.6] text-[#333]">{t.description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <section className={panel}>
          <div className="px-5 pt-5">
            <SectionTitle>Application Access</SectionTitle>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[17px] text-[#444]">Mobile Application</span>
              <Switch label="Mobile Application" checked={p.mobile} onChange={(v) => set('mobile', v)} />
            </div>
            <div className={clsx('mt-2 space-y-1.5 pb-5', !p.mobile && 'opacity-40')} role="radiogroup" aria-label="Mobile mode">
              {mobileModes.map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[#222]">
                  <input
                    type="radio"
                    name={`mobile-mode-${employee.code}`}
                    checked={p.mobileMode === m}
                    disabled={!p.mobile}
                    onChange={() => set('mobileMode', m)}
                    className="h-4 w-4 accent-[#1976d2]"
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-[#e5e5e5] px-5 py-5">
            {toggles.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[17px] text-[#444]">{label}</span>
                <Switch label={label} checked={p[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}

            {p.web && (
              <div className="space-y-5 pt-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <UnderlineInput label="Email" type="email" value={p.email} onChange={(v) => set('email', v)} />
                  <UnderlineInput label="User Name" value={p.username} onChange={(v) => set('username', v)} />
                </div>
                <label className="relative block">
                  <span className="sr-only">Role</span>
                  <select
                    value=""
                    onChange={(e) => e.target.value && set('roles', [...p.roles, e.target.value])}
                    className="block w-full cursor-pointer appearance-none border-0 border-b border-[#8a8a8a] bg-transparent pb-1.5 pt-1 text-[14px] text-[#666] outline-none focus:border-b-2 focus:border-[#1565c0]"
                  >
                    <option value="">Role</option>
                    {roleOptions
                      .filter((r) => !p.roles.includes(r))
                      .map((r) => (
                        <option key={r} value={r} className="text-[#222]">
                          {r}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1 top-1.5 h-4 w-4 fill-[#555] text-[#555]" />
                </label>
                <ul className="min-h-[150px] border border-[#d6d6d6] px-3 py-2">
                  {p.roles.map((r) => (
                    <li key={r} className="flex items-center justify-between py-2 text-[14px] text-[#222]">
                      {r}
                      <button
                        type="button"
                        aria-label={`Remove ${r} role`}
                        onClick={() => set('roles', p.roles.filter((x) => x !== r))}
                        className="rounded p-0.5 text-[#222] hover:bg-[#f3f4f6]"
                      >
                        <X className="h-5 w-5" strokeWidth={1.8} />
                      </button>
                    </li>
                  ))}
                  {!p.roles.length && <li className="py-2 text-[13px] text-[#9ca3af]">No roles assigned. Choose one above.</li>}
                </ul>
              </div>
            )}
          </div>
        </section>

        <div className="space-y-3">
          <section className={clsx(panel, 'px-5 py-5')}>
            <SectionTitle action={<LinkButton onClick={() => setEditingUnits((v) => !v)}>{editingUnits ? 'Done' : 'Manage Data'}</LinkButton>}>
              Data Access
            </SectionTitle>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[17px] text-[#444]">Unit wise permission given</span>
              <span className="text-[12.5px] text-[#1565c0]">
                {p.units.length} {p.units.length === 1 ? 'Unit' : 'Units'}
              </span>
            </div>
            <div className="mt-2">
              <AccessList items={p.units} options={allUnits} editing={editingUnits} onChange={(v) => set('units', v)} removeIcon={X} />
            </div>
          </section>

          <section className={clsx(panel, 'px-5 py-5')}>
            <SectionTitle
              action={<LinkButton onClick={() => setEditingServices((v) => !v)}>{editingServices ? 'Done' : 'Service Data'}</LinkButton>}
            >
              Service Access
            </SectionTitle>
            <div className="mt-2 text-[12.5px] text-[#1565c0]">
              {p.services.length} {p.services.length === 1 ? 'Service' : 'Services'}
            </div>
            <div className="mt-4">
              <AccessList
                items={p.services}
                options={allServices}
                editing={editingServices}
                onChange={(v) => set('services', v)}
                removeIcon={CircleX}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const leaveTypeOrder: LeaveType[] = ['Casual Leave', 'Sick Leave', 'Earned Leave']

function LeaveTab({ employee, today }: { employee: Employee; today: Date }) {
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const leaves = useMemo(
    () => monthAttendance(employee, year, month, today).filter((d) => d.status === 'Leave'),
    [employee, year, month, today],
  )
  const byType = leaveTypeOrder
    .map((t) => ({ type: t, count: leaves.filter((l) => l.leaveType === t).length }))
    .filter((t) => t.count)

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[210px_minmax(0,1fr)_96px]">
      <aside className={clsx(panel, 'lg:sticky lg:top-[120px]')}>
        <h2 className="border-b border-[#e5e5e5] px-4 py-4 text-[14.5px] font-medium text-[#1565c0]">Leave Summary</h2>
        {byType.length ? (
          <>
            {byType.map(({ type, count }) => (
              <SummaryRow key={type} label={type} value={count} unit={plural(count)} />
            ))}
            <SummaryRow label="Total Leave" value={leaves.length} unit={plural(leaves.length)} />
          </>
        ) : (
          <p className="px-4 py-9 text-center text-[14px] text-[#333]">No Data Available</p>
        )}
      </aside>

      <section className={clsx(panel, 'min-w-0')}>
        <h2 className="border-b border-[#e5e5e5] px-3 py-3.5 text-[15px] font-medium text-[#444]">
          Leave details for {monthYearLabel(year, month)}
        </h2>
        {leaves.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13px]">
              <thead>
                <tr className="bg-[#f3f5f8] text-[12px] text-[#374151]">
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Day</th>
                  <th className="px-4 py-2.5 font-medium">Leave Type</th>
                  <th className="px-4 py-2.5 font-medium">Duration</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.date.getTime()} className="border-t border-[#f0f0f0]">
                    <td className="px-4 py-3 text-[#1565c0]">{fmtShortDate(l.date)}</td>
                    <td className="px-4 py-3 text-[#555]">{l.date.toLocaleString('en-IN', { weekday: 'long' })}</td>
                    <td className="px-4 py-3">{l.leaveType}</td>
                    <td className="px-4 py-3 text-[#555]">Full Day</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#e7f8ef] px-2.5 py-0.5 text-[11.5px] font-medium text-[#15803d]">Approved</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-9 text-center text-[14px] text-[#333]">No Data Available !</p>
        )}
      </section>

      <MonthPicker
        year={year}
        month={month}
        today={today}
        onChange={(y, m) => {
          setYear(y)
          setMonth(m)
        }}
      />
    </div>
  )
}

function PayrollTab({ employee, today }: { employee: Employee; today: Date }) {
  const latest = releasedMonths[0]
  const [ym, setYm] = useState({ year: latest.year, month: latest.month })
  return (
    <PayslipView
      employee={employee}
      year={ym.year}
      month={ym.month}
      today={today}
      onChange={(year, month) => setYm({ year, month })}
      stickyTop="lg:top-[120px]"
    />
  )
}

// ---- Page ----

export default function EmployeeProfile() {
  const { code = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const [today] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })
  const employee = employees.find((e) => e.code === code)
  const tab: Tab = TABS.find((t) => t.toLowerCase() === params.get('tab')) ?? 'Attendance'

  if (!employee) {
    return (
      <div>
        <Link to="/employee" className="inline-flex items-center gap-1.5 text-[13px] text-[#4b5563] hover:text-[#1976d2]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to employees
        </Link>
        <div className={clsx(panel, 'mt-4 px-6 py-14 text-center text-[13px] text-[#888]')}>Employee not found.</div>
      </div>
    )
  }

  return (
    <div>
      <div className={clsx(fullBleedWhite, '-mt-8 flex items-center gap-3 pt-3')}>
        <Avatar variant={employee.gender === 'Female' ? 'female' : 'male'} className="h-[50px] w-[50px]" />
        <div>
          <h1 className="text-[20px] leading-tight text-[#333]">{employee.name}</h1>
          <div className="text-[13px] text-[#1565c0]">{employee.code}</div>
        </div>
      </div>

      <nav
        className={clsx(fullBleedWhite, 'sticky top-[60px] z-20 flex gap-1 overflow-x-auto border-b border-[#e5e5e5] shadow-[0_1px_0_#e5e5e5]')}
        aria-label="Employee sections"
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setParams(t === 'Attendance' ? {} : { tab: t.toLowerCase() }, { replace: true })}
            className={clsx(
              'whitespace-nowrap border-b-[3px] px-5 pb-2.5 pt-3.5 text-[15px] transition-colors',
              tab === t ? 'border-[#1565c0] text-[#1565c0]' : 'border-transparent text-[#1976d2] hover:text-[#0d47a1]',
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="mt-5">
        {tab === 'Attendance' && <AttendanceTab employee={employee} today={today} />}
        {tab === 'Information' && <InformationTab employee={employee} />}
        {tab === 'Permissions' && <PermissionsTab key={employee.code} employee={employee} />}
        {tab === 'Leave' && <LeaveTab employee={employee} today={today} />}
        {tab === 'Payroll' && <PayrollTab employee={employee} today={today} />}
      </div>
    </div>
  )
}
