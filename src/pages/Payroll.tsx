import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  CloudUpload,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Info,
  MoreVertical,
  Plus,
  RotateCw,
  Search,
  Send,
  UserRound,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import payrollReportUrl from '../assets/payroll.xlsx?url'
import { useNavigate } from 'react-router-dom'
import { Checkbox, FilterBox } from '../components/CheckboxFilter'
import MonthPicker from '../components/MonthPicker'
import { toggle } from '../lib/toggle'
import StatusBadge from '../components/StatusBadge'
import { employees } from '../data/employees'
import {
  defaultSalary,
  downloadPayslip,
  downloadTemplate,
  monthLabel,
  monthRangeOf,
  parsePeriodKey,
  parseCsv,
  payslipPath,
  periodKey,
  recordKey,
  releasedMonths,
  SALARY_FIELDS,
  setRecords,
  toISODate,
  updateRecord,
  usePayrollRecords,
  type PayRecord,
  type PayrollStatus,
  type Salary,
} from '../lib/payroll'

type UploadTarget = { code: string; periodKey: string }

type UploadDetails = {
  file: File
  payPeriodStart: string
  payPeriodEnd: string
  paymentDate: string
  notes: string
}

const MAX_PDF_BYTES = 10 * 1024 * 1024
const NOTES_LIMIT = 500

const monthDefaults = (key: string) => {
  const m = parsePeriodKey(key)
  if (!m) return { start: '', end: '', payment: '' }
  const r = monthRangeOf(m)
  return { start: toISODate(r.from), end: toISODate(r.to), payment: toISODate(r.to) }
}

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

const fieldBox =
  'flex h-[42px] items-center gap-2.5 rounded-md border bg-white px-3 transition-colors focus-within:border-[#1976d2]'

function FieldLabel({ children, required, htmlFor }: { children: ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-medium text-[#1f2937]">
      {children} {required && <span className="text-[#dc2626]">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-[11.5px] text-[#dc2626]">{message}</p> : null
}

function UploadPanel({
  initial,
  onClose,
  onSubmit,
}: {
  initial: UploadTarget
  onClose: () => void
  onSubmit: (target: UploadTarget, details: UploadDetails) => void
}) {
  const [code, setCode] = useState(initial.code)
  const [pKey, setPKey] = useState(initial.periodKey)
  const [start, setStart] = useState(() => monthDefaults(initial.periodKey).start)
  const [end, setEnd] = useState(() => monthDefaults(initial.periodKey).end)
  const [paymentDate, setPaymentDate] = useState(() => monthDefaults(initial.periodKey).payment)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const changeMonth = (key: string) => {
    setPKey(key)
    const d = monthDefaults(key)
    setStart(d.start)
    setEnd(d.end)
    setPaymentDate(d.payment)
  }

  const pickFile = (f: File | undefined) => {
    if (!f) return
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) return setFileError('Only PDF files are allowed.')
    if (f.size > MAX_PDF_BYTES) return setFileError('File is larger than 10 MB.')
    setFileError('')
    setFile(f)
  }

  const errors = {
    code: !code ? 'Please select an employee.' : undefined,
    pKey: !pKey ? 'Please select the payroll month.' : undefined,
    period: start && end && start > end ? 'Start date must be on or before the end date.' : undefined,
    paymentDate: !paymentDate ? 'Please choose the payment date.' : undefined,
    file: fileError || (!file ? 'Please upload the payslip PDF.' : undefined),
  }
  const show = (key: keyof typeof errors) => (submitted || (key === 'file' && fileError) ? errors[key] : undefined)
  const border = (key: keyof typeof errors) => (show(key) ? 'border-[#dc2626]' : 'border-[#d1d5db]')

  const submit = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean) || !file) return
    onSubmit({ code, periodKey: pKey }, { file, payPeriodStart: start, payPeriodEnd: end, paymentDate, notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-payroll-title"
        className="flex max-h-full w-full max-w-[480px] flex-col overflow-hidden rounded-lg bg-white text-[13px] text-[#1f2937] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <h3 id="upload-payroll-title" className="text-[18px] font-semibold">
            Upload Single Payroll
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-[#888] hover:bg-[#f3f4f6]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <div>
            <FieldLabel htmlFor="up-employee" required>
              Employee
            </FieldLabel>
            <div className={clsx(fieldBox, 'relative', border('code'))}>
              <UserRound className="h-4 w-4 shrink-0 text-[#6b7280]" />
              <select
                id="up-employee"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={clsx(
                  'h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-6 outline-none',
                  !code && 'text-[#9ca3af]',
                )}
              >
                <option value="">Select employee</option>
                {employees
                  .filter((e) => !e.relieved)
                  .map((e) => (
                    <option key={e.code} value={e.code} className="text-[#1f2937]">
                      {e.name} ({e.code})
                    </option>
                  ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[#555]" />
            </div>
            <FieldError message={show('code')} />
          </div>

          <div>
            <FieldLabel htmlFor="up-month" required>
              Payroll Month
            </FieldLabel>
            <div className={clsx(fieldBox, 'relative', border('pKey'))}>
              <CalendarDays className="h-4 w-4 shrink-0 text-[#6b7280]" />
              <select
                id="up-month"
                value={pKey}
                onChange={(e) => changeMonth(e.target.value)}
                className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-6 font-medium outline-none"
              >
                {releasedMonths.map((m) => (
                  <option key={periodKey(m)} value={periodKey(m)}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[#555]" />
            </div>
            <FieldError message={show('pKey')} />
          </div>

          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="up-start">Pay Period Start Date</FieldLabel>
                <div className={clsx(fieldBox, border('period'))}>
                  <input
                    id="up-start"
                    type="date"
                    value={start}
                    max={end || undefined}
                    onChange={(e) => setStart(e.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="up-end">Pay Period End Date</FieldLabel>
                <div className={clsx(fieldBox, border('period'))}>
                  <input
                    id="up-end"
                    type="date"
                    value={end}
                    min={start || undefined}
                    onChange={(e) => setEnd(e.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>
            <FieldError message={show('period')} />
          </div>

          <div>
            <FieldLabel htmlFor="up-payment" required>
              Payment Date
            </FieldLabel>
            <div className={clsx(fieldBox, border('paymentDate'))}>
              <input
                id="up-payment"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent outline-none"
              />
            </div>
            <FieldError message={show('paymentDate')} />
          </div>

          <div>
            <FieldLabel required>Upload Payslip PDF</FieldLabel>
            {file ? (
              <div className="flex items-center gap-3 rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-3">
                <FileText className="h-6 w-6 shrink-0 text-[#1976d2]" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{file.name}</div>
                  <div className="text-[11.5px] text-[#6b7280]">{formatSize(file.size)}</div>
                </div>
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={() => setFile(null)}
                  className="rounded p-1 text-[#6b7280] hover:bg-[#eef0f3]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  pickFile(e.dataTransfer.files[0])
                }}
                className={clsx(
                  'flex flex-col items-center rounded-md border border-dashed px-4 py-7 text-center transition-colors',
                  dragging ? 'border-[#1976d2] bg-[#eef6ff]' : show('file') ? 'border-[#dc2626] bg-[#fffafa]' : 'border-[#b6cff0] bg-[#f7faff]',
                )}
              >
                <CloudUpload className="h-7 w-7 text-[#475569]" strokeWidth={1.5} />
                <p className="mt-2 text-[13px] text-[#374151]">Drag and drop PDF here</p>
                <p className="text-[12px] text-[#9ca3af]">or</p>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-1.5 h-9 rounded-md border border-[#1976d2] bg-white px-5 text-[12.5px] font-medium text-[#1976d2] hover:bg-[#eef6ff]"
                >
                  Browse files
                </button>
                <p className="mt-2 text-[11.5px] text-[#6b7280]">PDF only, maximum 10 MB</p>
              </div>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                pickFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <FieldError message={show('file')} />
          </div>

          <div>
            <FieldLabel htmlFor="up-notes">
              Notes <span className="font-normal text-[#6b7280]">(Optional)</span>
            </FieldLabel>
            <textarea
              id="up-notes"
              value={notes}
              maxLength={NOTES_LIMIT}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any remarks or notes..."
              rows={4}
              className="block w-full resize-y rounded-md border border-[#d1d5db] px-3 py-2.5 outline-none placeholder:text-[#9ca3af] focus:border-[#1976d2]"
            />
            <div className="mt-1 text-right text-[11.5px] text-[#6b7280]">
              {notes.length}/{NOTES_LIMIT}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-[#d1d5db] bg-white font-medium hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="h-10 rounded-md bg-[#1976d2] font-medium text-white shadow-sm hover:bg-[#1565c0]"
          >
            Upload Payroll
          </button>
        </div>
      </div>
    </div>
  )
}

type MenuItem = { label: string; icon: LucideIcon; action: () => void }

function RowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-label="Actions"
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#555] hover:bg-[#f3f4f6]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-[#e5e7eb] bg-white py-1 text-left text-[13px] shadow-lg">
          {items.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false)
                action()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#f3f4f6]"
            >
              <Icon className="h-3.5 w-3.5 text-[#666]" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type SortKey = 'code' | 'name' | 'service' | 'designation' | 'status'
const PAGE_SIZE = 10
const statusOrder: Record<PayrollStatus, number> = { Published: 0, Draft: 1, Pending: 2 }

const departments = [...new Set(employees.map((e) => e.service))].sort()
const payrollStatuses: PayrollStatus[] = ['Published', 'Draft', 'Pending']
const DESIGNATIONS_PREVIEW = 6
const designationList = [...new Set(employees.map((e) => e.designation))].sort()

function SortHeader({ label, sortKey, sort, onSort }: {
  label: string
  sortKey: SortKey
  sort: { key: SortKey; dir: 'asc' | 'desc' }
  onSort: (key: SortKey) => void
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ChevronUp : ChevronDown
  return (
    <button type="button" onClick={() => onSort(sortKey)} className="flex items-center gap-1 hover:text-[#1976d2]">
      {label}
      <Icon className={clsx('h-3 w-3', !active && 'text-[#9ca3af]')} />
    </button>
  )
}

export default function EmployeePayslips() {
  const [today] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })
  const [ym, setYm] = useState({ year: releasedMonths[0].year, month: releasedMonths[0].month })
  const [selDepartments, setSelDepartments] = useState<string[]>([])
  const [selDesignations, setSelDesignations] = useState<string[]>([])
  const [selStatuses, setSelStatuses] = useState<PayrollStatus[]>([])
  const [showAllDesignations, setShowAllDesignations] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'code', dir: 'asc' })
  const [page, setPage] = useState(1)
  const records = usePayrollRecords()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState<UploadTarget | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const bulkInput = useRef<HTMLInputElement>(null)

  // The released payroll month matching the picker, if any
  const selectedPeriod = releasedMonths.find((m) => m.year === ym.year && m.month === ym.month)
  const latestPeriod = selectedPeriod ?? releasedMonths[0]

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matching = employees.filter(
      (e) =>
        !e.relieved &&
        (!selDepartments.length || selDepartments.includes(e.service)) &&
        (!selDesignations.length || selDesignations.includes(e.designation)) &&
        (!q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)),
    )
    const period = releasedMonths.find((m) => m.year === ym.year && m.month === ym.month)
    const list = period ? matching.map((employee) => ({ employee, period, key: recordKey(period, employee.code) })) : []
    const dir = sort.dir === 'asc' ? 1 : -1
    const statusOf = (key: string) => records[key]?.status ?? 'Pending'
    return list.filter((r) => !selStatuses.length || selStatuses.includes(statusOf(r.key))).sort((a, b) => {
      const primary =
        sort.key === 'status'
          ? statusOrder[statusOf(a.key)] - statusOrder[statusOf(b.key)]
          : a.employee[sort.key].localeCompare(b.employee[sort.key])
      return primary * dir || a.employee.code.localeCompare(b.employee.code)
    })
  }, [selDepartments, selDesignations, selStatuses, query, sort, records, ym])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const filterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value)
    setPage(1)
  }

  const resetFilters = () => {
    setYm({ year: releasedMonths[0].year, month: releasedMonths[0].month })
    setSelDepartments([])
    setSelDesignations([])
    setSelStatuses([])
    setQuery('')
    setPage(1)
  }

  const changeMonth = (year: number, month: number) => {
    setYm({ year, month })
    setPage(1)
  }

  const monthYear = monthLabel({ year: ym.year, month: ym.month })

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))

  const handleUpload = (target: UploadTarget, { file, ...details }: UploadDetails) => {
    const emp = employees.find((e) => e.code === target.code)
    const key = `${target.periodKey}|${target.code}`
    const previous = records[key]?.fileUrl
    if (previous) URL.revokeObjectURL(previous)
    updateRecord(key, {
      status: 'Published',
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      salary: records[key]?.salary ?? (emp && defaultSalary(emp)),
      ...details,
      notes: details.notes || undefined,
    })
    setUploading(null)
    setToast({ type: 'success', text: `Payroll uploaded for ${emp?.name ?? target.code}.` })
  }

  const handleBulkUpload = async (file: File) => {
    if (!/\.csv$/i.test(file.name)) {
      return setToast({ type: 'error', text: 'Please save the Excel sheet as CSV (File → Save As → CSV) and upload it.' })
    }
    const [header, ...data] = parseCsv(await file.text())
    if (!header || header[0]?.toLowerCase() !== 'employee id') {
      return setToast({ type: 'error', text: 'Invalid file. Please use the downloaded Excel template.' })
    }
    const validPeriods = new Set(releasedMonths.map(periodKey))
    const updates: Record<string, PayRecord> = {}
    let skipped = 0
    for (const [code, month, ...amounts] of data) {
      const nums = amounts.slice(0, SALARY_FIELDS.length).map(Number)
      const emp = employees.find((e) => e.code.toLowerCase() === code?.toLowerCase())
      if (!emp || !validPeriods.has(month) || nums.length < SALARY_FIELDS.length || nums.some((n) => !Number.isFinite(n) || n < 0)) {
        skipped++
        continue
      }
      const salary = Object.fromEntries(SALARY_FIELDS.map((f, i) => [f, nums[i]])) as Salary
      const key = `${month}|${emp.code}`
      updates[key] = { ...records[key], status: records[key]?.status === 'Published' ? 'Published' : 'Draft', salary }
    }
    setRecords((r) => ({ ...r, ...updates }))
    const imported = Object.keys(updates).length
    setToast({
      type: imported ? 'success' : 'error',
      text: `Imported ${imported} record${imported === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} invalid row${skipped === 1 ? '' : 's'}` : ''}.`,
    })
  }

  const thClass = 'px-3 py-3 font-medium'

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1f2937]">Employee Payslips</h1>
          <p className="mt-0.5 text-[12.5px] text-[#6b7280]">Manage employee payroll records and publish monthly payslips.</p>
        </div>
        <div className="flex gap-2.5">
          {/* <button
            type="button"
            onClick={() => setUploading({ code: '', periodKey: periodKey(latestPeriod) })}
            className="flex h-9 items-center gap-2 rounded-md bg-[#1976d2] px-4 text-[12.5px] font-medium text-white shadow-sm hover:bg-[#1565c0]"
          >
            <Plus className="h-4 w-4" /> Upload Payroll
          </button> */}
          <button
            type="button"
            onClick={() => bulkInput.current?.click()}
            className="flex h-9 items-center gap-2 rounded-md border border-[#1976d2] bg-white px-4 text-[12.5px] font-medium text-[#1976d2] hover:bg-[#eef6ff]"
          >
            <FileSpreadsheet className="h-4 w-4" /> Bulk Upload (Excel)
          </button>
          <a
            href={payrollReportUrl}
            download="payroll.xlsx"
            className="flex h-9 items-center gap-2 rounded-md border border-[#1976d2] bg-white px-4 text-[12.5px] font-medium text-[#1976d2] hover:bg-[#eef6ff]"
          >
            <Download className="h-4 w-4" /> Download Report
          </a>
          <input
            ref={bulkInput}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleBulkUpload(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex max-w-[580px]">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Search employee name, code"
          aria-label="Search employee name or code"
          className="h-[38px] min-w-0 flex-1 border border-[#d6d6d6] bg-white px-5 text-[14px] text-[#222] outline-none placeholder:text-[#aaa] focus:border-[#1976d2]"
        />
        <span className="flex h-[38px] w-[48px] items-center justify-center border border-l-0 border-[#d6d6d6] bg-[#f0f0f0] text-[#555]">
          <Search className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 grid items-start gap-3 lg:grid-cols-[210px_minmax(0,1fr)_96px]">
        <aside className="space-y-3">
          <FilterBox
            header={<Checkbox label={`All ${payrollStatuses.length} statuses`} checked={!selStatuses.length} onChange={() => filterChange(setSelStatuses, [])} />}
          >
            {payrollStatuses.map((st) => (
              <Checkbox
                key={st}
                label={st}
                checked={selStatuses.includes(st)}
                onChange={() => filterChange(setSelStatuses, toggle(selStatuses, st))}
              />
            ))}
          </FilterBox>

          <FilterBox
            header={
              <Checkbox
                label={`All ${departments.length} departments`}
                checked={!selDepartments.length}
                onChange={() => filterChange(setSelDepartments, [])}
              />
            }
          >
            {departments.map((d) => (
              <Checkbox
                key={d}
                label={d}
                checked={selDepartments.includes(d)}
                onChange={() => filterChange(setSelDepartments, toggle(selDepartments, d))}
              />
            ))}
          </FilterBox>

          <FilterBox
            header={
              <Checkbox
                label={`All ${designationList.length} designations`}
                checked={!selDesignations.length}
                onChange={() => filterChange(setSelDesignations, [])}
              />
            }
          >
            {(showAllDesignations ? designationList : designationList.slice(0, DESIGNATIONS_PREVIEW)).map((d) => (
              <Checkbox
                key={d}
                label={d}
                checked={selDesignations.includes(d)}
                onChange={() => filterChange(setSelDesignations, toggle(selDesignations, d))}
              />
            ))}
            {designationList.length > DESIGNATIONS_PREVIEW && (
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowAllDesignations((v) => !v)}
                  className="text-[13px] text-[#1976d2] hover:underline"
                >
                  {showAllDesignations ? 'Show less' : `+ ${designationList.length - DESIGNATIONS_PREVIEW} more`}
                </button>
              </div>
            )}
          </FilterBox>

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-[36px] w-full items-center justify-center gap-1.5 border border-[#1976d2] bg-white text-[12.5px] font-medium text-[#1976d2] hover:bg-[#eef6ff]"
          >
            <RotateCw className="h-3.5 w-3.5" /> Reset all filters
          </button>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#d6e6fb] bg-[#eef6ff] px-4 py-3 text-[12.5px]">
            <span className="flex items-center gap-2.5 text-[#1e3a8a]">
              <Info className="h-4 w-4 text-[#1976d2]" />
              Upload individual payslips or import multiple employees using an Excel template.
            </span>
            <button
              type="button"
              onClick={() => downloadTemplate(latestPeriod)}
              className="flex items-center gap-1.5 font-medium text-[#1976d2] hover:underline"
            >
              <Download className="h-3.5 w-3.5" /> Download Excel Template
            </button>
          </div>

          <h2 className="mt-4 text-[15px] font-medium text-[#333]">Payroll for {monthYear}</h2>

          <div className="mt-3 rounded-lg border border-[#e5e7eb] bg-white pt-1.5">
            <div className="px-1.5">
              <div className="overflow-x-auto rounded-md border border-[#eef0f3]">
                <table className="w-full min-w-[700px] text-left text-[12.5px]">
                  <thead>
                    <tr className="whitespace-nowrap bg-[#f3f5f8] text-[11.5px] text-[#374151]">
                      <th className={thClass}>
                        <SortHeader label="Employee ID" sortKey="code" sort={sort} onSort={toggleSort} />
                      </th>
                      <th className={thClass}>
                        <SortHeader label="Name" sortKey="name" sort={sort} onSort={toggleSort} />
                      </th>
                      <th className={thClass}>
                        <SortHeader label="Department" sortKey="service" sort={sort} onSort={toggleSort} />
                      </th>
                      <th className={thClass}>
                        <SortHeader label="Designation" sortKey="designation" sort={sort} onSort={toggleSort} />
                      </th>
                      <th className={thClass}>
                        <SortHeader label="Payroll Status" sortKey="status" sort={sort} onSort={toggleSort} />
                      </th>
                      <th className={thClass}>Payslip</th>
                      <th className={clsx(thClass, 'text-center')}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(({ employee: e, period, key }) => {
                      const record = records[key] ?? { status: 'Pending' as const }
                      const payslip = { employee: e, period, record }
                      const openUpload = () => setUploading({ code: e.code, periodKey: periodKey(period) })
                      const menu: MenuItem[] =
                        record.status === 'Published'
                          ? [
                              { label: 'View Payslip', icon: Eye, action: () => navigate(payslipPath(e.code, period)) },
                              { label: 'Download PDF', icon: Download, action: () => downloadPayslip(payslip) },
                              { label: 'Replace PDF', icon: Upload, action: openUpload },
                              { label: 'Move to Draft', icon: FileText, action: () => updateRecord(key, { status: 'Draft' }) },
                            ]
                          : [
                              { label: 'Upload PDF', icon: Upload, action: openUpload },
                              ...(record.status === 'Draft'
                                ? [
                                    { label: 'Preview', icon: Eye, action: () => navigate(payslipPath(e.code, period)) },
                                    {
                                      label: 'Publish',
                                      icon: Send,
                                      action: () => {
                                        updateRecord(key, { status: 'Published' })
                                        setToast({ type: 'success', text: `Payslip published for ${e.name}.` })
                                      },
                                    },
                                  ]
                                : []),
                            ]

                      return (
                        <tr key={key} className="border-t border-[#eef0f3] text-[#1f2937] hover:bg-[#fafbfc]">
                          <td className="whitespace-nowrap px-3 py-3.5 font-medium">{e.code}</td>
                          <td className="px-3 py-3.5">{e.name}</td>
                          <td className="px-3 py-3.5">{e.service}</td>
                          <td className="px-3 py-3.5">{e.designation}</td>
                          <td className="whitespace-nowrap px-3 py-3.5">
                            <StatusBadge status={record.status} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5">
                            {record.status === 'Published' ? (
                              <button
                                type="button"
                                onClick={() => navigate(payslipPath(e.code, period))}
                                className="flex items-center gap-2 text-[#1976d2] hover:underline"
                              >
                                <FileText className="h-4 w-4" /> View Payslip
                              </button>
                            ) : (
                              <button type="button" onClick={openUpload} className="flex items-center gap-2 text-[#1976d2] hover:underline">
                                <Upload className="h-4 w-4" /> Upload
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <RowMenu items={menu} />
                          </td>
                        </tr>
                      )
                    })}
                    {!pageRows.length && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-[#888]">
                          <FileText className="mx-auto mb-2 h-6 w-6 text-[#ccc]" />
                          {selectedPeriod ? 'No payroll records match the selected filters.' : `Payroll for ${monthYear} hasn't been released yet.`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 text-[11.5px] text-[#6b7280]">
              <span>
                Showing {pageRows.length} of {rows.length} employees
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5e7eb] text-[#555] hover:bg-[#f3f4f6] disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={clsx(
                      'h-7 min-w-7 rounded-md px-2 text-[12px]',
                      n === currentPage ? 'bg-[#1976d2] text-white' : 'border border-[#e5e7eb] text-[#555] hover:bg-[#f3f4f6]',
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5e7eb] text-[#555] hover:bg-[#f3f4f6] disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <MonthPicker year={ym.year} month={ym.month} today={today} onChange={changeMonth} stickyTop="lg:top-[80px]" />
      </div>

      {uploading && <UploadPanel initial={uploading} onClose={() => setUploading(null)} onSubmit={handleUpload} />}

      {toast && (
        <div
          role="status"
          className={clsx(
            'fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-2 rounded-md px-4 py-3 text-[12.5px] text-white shadow-lg',
            toast.type === 'success' ? 'bg-[#15803d]' : 'bg-[#dc2626]',
          )}
        >
          {toast.type === 'success' ? <CheckCircle2 className="mt-px h-4 w-4 shrink-0" /> : <Info className="mt-px h-4 w-4 shrink-0" />}
          {toast.text}
        </div>
      )}
    </div>
  )
}
