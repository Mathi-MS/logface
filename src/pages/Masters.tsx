import { useState, type ReactNode } from 'react'
import {
  BadgePercent,
  Banknote,
  CalendarDays,
  CircleCheck,
  CirclePlay,
  Clock,
  Coins,
  Database,
  FileText,
  Gift,
  Info,
  Landmark,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'

const tabs: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'payroll', label: 'Payroll', icon: Database },
  { id: 'salary', label: 'Salary & Deduction Masters', icon: Coins },
  { id: 'location', label: 'Location & Department', icon: MapPin },
  { id: 'payment', label: 'Payment & Bank Details', icon: Landmark },
  { id: 'reports', label: 'Reports & Templates', icon: FileText },
  { id: 'system', label: 'System Settings', icon: Settings },
]

const payrollSections: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'configuration', label: 'Payroll Configuration', icon: Settings },
  { id: 'calendar', label: 'Payroll Calendar', icon: CalendarDays },
  { id: 'pay-cycle', label: 'Pay Cycle', icon: Clock },
  { id: 'tax', label: 'Tax Configuration', icon: FileText },
  { id: 'statutory', label: 'Statutory Settings', icon: ShieldCheck },
  { id: 'overtime', label: 'Overtime Settings', icon: Clock },
  { id: 'bonus', label: 'Bonus & Incentive', icon: Gift },
  { id: 'arrears', label: 'Arrears & Adjustments', icon: ScanLine },
  { id: 'processing', label: 'Payroll Processing', icon: CirclePlay },
]

const defaultConfig = {
  companyName: 'Logface Solutions',
  payrollType: 'Monthly',
  currency: 'INR (₹)',
  financialYear: '2025 - 2026',
  startDate: '2025-04-01',
  workingDays: 30,
  payMode: 'Bank Transfer',
  country: 'India',
  payCycle: 'Monthly',
  cycleStartDay: 1,
  cycleEndDay: 30,
  cutoffDay: 25,
  autoProcess: true,
  manualOverride: false,
  advanceSalary: true,
  negativeAttendance: false,
  tds: 'Yes',
  pf: 'Yes',
  esi: 'Yes',
  pt: 'Yes',
  tdsType: 'As per slab',
  pfPercent: 12,
  esiPercent: 3.25,
  ptExemption: 250000,
  otRateType: 'Double Time',
  otBasis: 'Basic Salary',
  dailyOtLimit: 8,
  weeklyOtLimit: 48,
}

type Config = typeof defaultConfig

const fieldClass =
  'mt-1.5 h-10 w-full rounded-md border border-[#d1d5db] bg-white px-3 text-[13px] text-[#222] outline-none focus:border-[#1976d2]'

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block text-[12px] text-[#444]">
      {label}
      {required && <span className="text-[#e53935]"> *</span>}
      {children}
    </label>
  )
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className={fieldClass}
    />
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="text-[12px] text-[#444]">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="mt-2 flex items-center gap-2.5"
      >
        <span
          className={clsx(
            'relative h-6 w-11 rounded-full transition-colors',
            checked ? 'bg-[#2e9b46]' : 'bg-[#d1d5db]',
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
              checked ? 'left-[22px]' : 'left-0.5',
            )}
          />
        </span>
        <span className="text-[12px] text-[#666]">{checked ? 'Enabled' : 'Disabled'}</span>
      </button>
    </div>
  )
}

function Card({
  title,
  icon: Icon,
  tone,
  children,
}: {
  title: string
  icon: LucideIcon
  tone: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#e3e8f0]">
      <div className={clsx('flex items-center gap-3 border-b border-[#e3e8f0] px-4 py-2.5', tone)}>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/70">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
        <h3 className="text-[13px] font-semibold text-[#222]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  )
}

function PageHeader({
  title,
  subtitle,
  saved,
  onReset,
  onSave,
}: {
  title: string
  subtitle: string
  saved: boolean
  onReset: () => void
  onSave: () => void
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[17px] font-semibold text-[#1a2340]">{title}</h2>
        <p className="text-[12px] text-[#777]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-[12px] text-[#2e9b46]">
            <CircleCheck className="h-4 w-4" /> Saved
          </span>
        )}
        <button
          type="button"
          onClick={onReset}
          className="flex h-9 items-center gap-2 rounded-md border border-[#d1d5db] bg-white px-4 text-[13px] text-[#333] hover:bg-[#f5f6fa]"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex h-9 items-center gap-2 rounded-md bg-[#1976d2] px-4 text-[13px] font-medium text-white hover:bg-[#1565c0]"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </div>
  )
}

function PayrollConfiguration() {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [saved, setSaved] = useState(false)
  const set = <K extends keyof Config>(key: K) => (value: Config[K]) => {
    setConfig((c) => ({ ...c, [key]: value }))
    setSaved(false)
  }
  const yesNo = ['Yes', 'No']

  return (
    <div>
      <PageHeader
        title="Payroll Configuration"
        subtitle="Set up the basic payroll configuration for your organization."
        saved={saved}
        onReset={() => {
          setConfig(defaultConfig)
          setSaved(false)
        }}
        onSave={() => setSaved(true)}
      />

      <div className="space-y-4">
        <Card title="Basic Payroll Details" icon={Settings} tone="bg-[#eef5ff] text-[#1976d2]">
          <Field label="Company Name" required>
            <input value={config.companyName} onChange={(e) => set('companyName')(e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Payroll Type" required>
            <Select value={config.payrollType} options={['Monthly', 'Bi-Weekly', 'Weekly']} onChange={set('payrollType')} />
          </Field>
          <Field label="Currency" required>
            <Select value={config.currency} options={['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)']} onChange={set('currency')} />
          </Field>
          <Field label="Financial Year" required>
            <Select
              value={config.financialYear}
              options={['2024 - 2025', '2025 - 2026', '2026 - 2027']}
              onChange={set('financialYear')}
            />
          </Field>
          <Field label="Payroll Start Date" required>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => set('startDate')(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Working Days in Month" required>
            <NumberInput value={config.workingDays} min={1} max={31} onChange={set('workingDays')} />
          </Field>
          <Field label="Default Pay Mode" required>
            <Select value={config.payMode} options={['Bank Transfer', 'Cheque', 'Cash']} onChange={set('payMode')} />
          </Field>
          <Field label="Country">
            <Select value={config.country} options={['India', 'United States', 'United Kingdom', 'Singapore']} onChange={set('country')} />
          </Field>
        </Card>

        <Card title="Pay Cycle & Processing" icon={Database} tone="bg-[#ecf8f0] text-[#2e9b46]">
          <Field label="Pay Cycle" required>
            <Select value={config.payCycle} options={['Monthly', 'Bi-Weekly', 'Weekly']} onChange={set('payCycle')} />
          </Field>
          <Field label="Cycle Start Day" required>
            <NumberInput value={config.cycleStartDay} min={1} max={31} onChange={set('cycleStartDay')} />
          </Field>
          <Field label="Cycle End Day" required>
            <NumberInput value={config.cycleEndDay} min={1} max={31} onChange={set('cycleEndDay')} />
          </Field>
          <Field label="Process Cut-off Day" required>
            <NumberInput value={config.cutoffDay} min={1} max={31} onChange={set('cutoffDay')} />
          </Field>
          <Toggle label="Auto Process Payroll" checked={config.autoProcess} onChange={set('autoProcess')} />
          <Toggle label="Allow Manual Override" checked={config.manualOverride} onChange={set('manualOverride')} />
          <Toggle label="Enable Advance Salary" checked={config.advanceSalary} onChange={set('advanceSalary')} />
          <Toggle label="Allow Negative Attendance" checked={config.negativeAttendance} onChange={set('negativeAttendance')} />
        </Card>

        <Card title="Tax & Statutory Settings" icon={BadgePercent} tone="bg-[#f4effc] text-[#7b3fc4]">
          <Field label="TDS Applicable">
            <Select value={config.tds} options={yesNo} onChange={set('tds')} />
          </Field>
          <Field label="PF Applicable">
            <Select value={config.pf} options={yesNo} onChange={set('pf')} />
          </Field>
          <Field label="ESI Applicable">
            <Select value={config.esi} options={yesNo} onChange={set('esi')} />
          </Field>
          <Field label="PT Applicable">
            <Select value={config.pt} options={yesNo} onChange={set('pt')} />
          </Field>
          <Field label="TDS Deduction Type">
            <Select value={config.tdsType} options={['As per slab', 'Flat rate']} onChange={set('tdsType')} />
          </Field>
          <Field label="PF Contribution (%)">
            <NumberInput value={config.pfPercent} min={0} max={100} step={0.01} onChange={set('pfPercent')} />
          </Field>
          <Field label="ESI Contribution (%)">
            <NumberInput value={config.esiPercent} min={0} max={100} step={0.01} onChange={set('esiPercent')} />
          </Field>
          <Field label="PT Exemption Limit (Annual)">
            <NumberInput value={config.ptExemption} min={0} step={1000} onChange={set('ptExemption')} />
          </Field>
        </Card>

        <Card title="Overtime Settings" icon={Clock} tone="bg-[#eef5ff] text-[#1976d2]">
          <Field label="Overtime Rate Type">
            <Select value={config.otRateType} options={['Double Time', 'Time and a Half', 'Flat Rate']} onChange={set('otRateType')} />
          </Field>
          <Field label="OT Calculation Basis">
            <Select value={config.otBasis} options={['Basic Salary', 'Gross Salary']} onChange={set('otBasis')} />
          </Field>
          <Field label="Daily OT Limit (Hours)">
            <NumberInput value={config.dailyOtLimit} min={0} max={24} onChange={set('dailyOtLimit')} />
          </Field>
          <Field label="Weekly OT Limit (Hours)">
            <NumberInput value={config.weeklyOtLimit} min={0} max={168} onChange={set('weeklyOtLimit')} />
          </Field>
        </Card>
      </div>
    </div>
  )
}

type Row = Record<string, string> & { id: string }
type Column = { key: string; label: string; options?: string[]; required?: boolean }

const componentColumns: Column[] = [
  { key: 'name', label: 'Component Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'type', label: 'Type', options: ['Earning', 'Reimbursement'] },
  { key: 'calc', label: 'Calculation Type', options: ['Fixed Amount', 'Percentage', 'Variable'] },
  { key: 'value', label: 'Amount / Value', required: true },
  { key: 'taxable', label: 'Taxable', options: ['Yes', 'No'] },
  { key: 'status', label: 'Status', options: ['Active', 'Inactive'] },
]

const deductionColumns: Column[] = [
  { key: 'name', label: 'Deduction Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'type', label: 'Type', options: ['Statutory', 'Non-Statutory'] },
  { key: 'calc', label: 'Calculation Type', options: ['Fixed Amount', 'Percentage', 'As per Slab'] },
  { key: 'value', label: 'Value / Rate', required: true },
  { key: 'applicable', label: 'Applicable For', required: true },
  { key: 'status', label: 'Status', options: ['Active', 'Inactive'] },
]

const defaultComponents: Row[] = [
  ['Basic Salary', 'BASIC', 'Fixed Amount', '₹ 15,000'],
  ['House Rent Allowance', 'HRA', 'Percentage', '40% of Basic'],
  ['Conveyance Allowance', 'CONV', 'Fixed Amount', '₹ 1,000'],
  ['Medical Allowance', 'MED', 'Fixed Amount', '₹ 1,250'],
  ['Special Allowance', 'SPL', 'Variable', 'As per policy'],
].map(([name, code, calc, value]) => ({
  id: code,
  name,
  code,
  type: 'Earning',
  calc,
  value,
  taxable: 'Yes',
  status: 'Active',
}))

const defaultDeductions: Row[] = [
  ['Provident Fund (PF)', 'PF', 'Statutory', 'Percentage', '12% of Basic', 'All Employees'],
  ['ESI', 'ESI', 'Statutory', 'Percentage', '3.25% of Gross', 'Applicable Employees'],
  ['Professional Tax', 'PT', 'Statutory', 'Fixed Amount', '₹ 200', 'All Employees'],
  ['TDS', 'TDS', 'Statutory', 'As per Slab', 'As per Income Tax Slab', 'All Employees'],
  ['Loan Recovery', 'LOAN', 'Non-Statutory', 'Fixed Amount', '₹ 1,000', 'As per Loan'],
].map(([name, code, type, calc, value, applicable]) => ({
  id: code,
  name,
  code,
  type,
  calc,
  value,
  applicable,
  status: 'Active',
}))

const defaultStructure = {
  structureType: 'Monthly',
  payMode: 'Bank Transfer',
  payCycle: 'Monthly',
  effectiveFrom: '2025-04-01',
  negativeAttendance: false,
  autoProcess: true,
}

const pillTone: Record<string, string> = {
  Earning: 'bg-[#e3f5e8] text-[#2e7d32]',
  Reimbursement: 'bg-[#fff4e0] text-[#b26a00]',
  Statutory: 'bg-[#e6f0fd] text-[#1976d2]',
  'Non-Statutory': 'bg-[#f1e8fc] text-[#7b3fc4]',
  Yes: 'bg-[#e3f5e8] text-[#2e7d32]',
  No: 'bg-[#f1f2f4] text-[#666]',
}

function Pill({ value }: { value: string }) {
  return <span className={clsx('rounded-full px-3 py-1 text-[11px] font-medium', pillTone[value])}>{value}</span>
}

function RowDialog({
  title,
  columns,
  row,
  onSave,
  onClose,
}: {
  title: string
  columns: Column[]
  row: Row
  onSave: (row: Row) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(row)
  const missing = columns.some((c) => c.required && !draft[c.key]?.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[520px] rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (!missing) onSave(draft)
        }}
      >
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <h3 className="text-[16px] font-medium text-[#222]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-[#888] hover:bg-[#f3f4f6]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
          {columns.map((c) => (
            <Field key={c.key} label={c.label} required={c.required}>
              {c.options ? (
                <Select value={draft[c.key]} options={c.options} onChange={(v) => setDraft((d) => ({ ...d, [c.key]: v }))} />
              ) : (
                <input
                  value={draft[c.key] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                  className={fieldClass}
                />
              )}
            </Field>
          ))}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-[#d1d5db] px-4 text-[13px] text-[#333] hover:bg-[#f5f6fa]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={missing}
            className="h-9 rounded-md bg-[#1976d2] px-4 text-[13px] font-medium text-white hover:bg-[#1565c0] disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  tone,
  action,
}: {
  title: string
  subtitle: string
  icon: LucideIcon
  tone: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e8f0] bg-[#f5f9ff] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', tone)}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
        <div>
          <h3 className="text-[14px] font-semibold text-[#1a2340]">{title}</h3>
          <p className="text-[11px] text-[#777]">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

function MasterTable({
  title,
  subtitle,
  icon,
  tone,
  addLabel,
  columns,
  pillKeys,
  rows,
  onChange,
}: {
  title: string
  subtitle: string
  icon: LucideIcon
  tone: string
  addLabel: string
  columns: Column[]
  pillKeys: string[]
  rows: Row[]
  onChange: (rows: Row[]) => void
}) {
  const [editing, setEditing] = useState<{ row: Row; isNew: boolean } | null>(null)
  const blank = (): Row => ({
    id: crypto.randomUUID(),
    ...Object.fromEntries(columns.map((c) => [c.key, c.options?.[0] ?? ''])),
  })

  return (
    <section className="overflow-hidden rounded-lg border border-[#e3e8f0]">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        tone={tone}
        action={
          <button
            type="button"
            onClick={() => setEditing({ row: blank(), isNew: true })}
            className="flex h-9 items-center gap-2 rounded-md border border-[#1976d2] bg-white px-4 text-[13px] text-[#1976d2] hover:bg-[#eef5ff]"
          >
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[12px]">
          <thead className="bg-[#f5f6fa] text-[#444]">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2.5 font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#eef0f4] text-[#333]">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5">
                    {c.key === 'status' ? (
                      <span className="flex items-center gap-2">
                        <span
                          className={clsx('h-2 w-2 rounded-full', row.status === 'Active' ? 'bg-[#2e9b46]' : 'bg-[#bbb]')}
                        />
                        {row.status}
                      </span>
                    ) : pillKeys.includes(c.key) ? (
                      <Pill value={row[c.key]} />
                    ) : (
                      row[c.key]
                    )}
                  </td>
                ))}
                <td className="px-4 py-2.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing({ row, isNew: false })}
                      aria-label={`Edit ${row.name}`}
                      className="rounded-md border border-[#d1d5db] p-1.5 text-[#555] hover:bg-[#f5f6fa]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${row.name}"?`)) onChange(rows.filter((r) => r.id !== row.id))
                      }}
                      aria-label={`Delete ${row.name}`}
                      className="rounded-md border border-[#d1d5db] p-1.5 text-[#555] hover:border-[#e53935] hover:text-[#e53935]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-[#888]">
                  Nothing added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <RowDialog
          title={`${editing.isNew ? 'Add' : 'Edit'} ${columns[0].label.replace(' Name', '')}`}
          columns={columns}
          row={editing.row}
          onClose={() => setEditing(null)}
          onSave={(saved) => {
            onChange(editing.isNew ? [...rows, saved] : rows.map((r) => (r.id === saved.id ? saved : r)))
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function SalaryDeductionMasters() {
  const [components, setComponents] = useState(defaultComponents)
  const [deductions, setDeductions] = useState(defaultDeductions)
  const [structure, setStructure] = useState(defaultStructure)
  const [saved, setSaved] = useState(false)
  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setSaved(false)
  }
  const set = <K extends keyof typeof defaultStructure>(key: K) =>
    change((value: (typeof defaultStructure)[K]) => setStructure((s) => ({ ...s, [key]: value })))

  return (
    <div>
      <PageHeader
        title="Salary & Deduction Masters"
        subtitle="Define salary components, deduction types, and their applicable rules for your organization."
        saved={saved}
        onReset={() => {
          setComponents(defaultComponents)
          setDeductions(defaultDeductions)
          setStructure(defaultStructure)
          setSaved(false)
        }}
        onSave={() => setSaved(true)}
      />

      <div className="space-y-4">
        <MasterTable
          title="Salary Components"
          subtitle="Manage fixed and variable earning components (e.g., Basic, HRA, Allowances)."
          icon={Database}
          tone="bg-[#e6f0fd] text-[#1976d2]"
          addLabel="Add Component"
          columns={componentColumns}
          pillKeys={['type', 'taxable']}
          rows={components}
          onChange={change(setComponents)}
        />

        <MasterTable
          title="Deduction Types"
          subtitle="Manage statutory and non-statutory deductions (e.g., PF, ESI, TDS, Loan)."
          icon={BadgePercent}
          tone="bg-[#f1e8fc] text-[#7b3fc4]"
          addLabel="Add Deduction"
          columns={deductionColumns}
          pillKeys={['type']}
          rows={deductions}
          onChange={change(setDeductions)}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
          <section className="overflow-hidden rounded-lg border border-[#e3e8f0]">
            <SectionHeader
              title="Default Salary Structure"
              subtitle="Set the default salary structure for new employees."
              icon={Settings}
              tone="bg-[#e6f0fd] text-[#1976d2]"
            />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Salary Structure Type" required>
                <Select value={structure.structureType} options={['Monthly', 'Annual', 'Hourly']} onChange={set('structureType')} />
              </Field>
              <Field label="Payment Mode" required>
                <Select value={structure.payMode} options={['Bank Transfer', 'Cheque', 'Cash']} onChange={set('payMode')} />
              </Field>
              <Field label="Default Pay Cycle" required>
                <Select value={structure.payCycle} options={['Monthly', 'Bi-Weekly', 'Weekly']} onChange={set('payCycle')} />
              </Field>
              <Field label="Effective From" required>
                <input
                  type="date"
                  value={structure.effectiveFrom}
                  onChange={(e) => set('effectiveFrom')(e.target.value)}
                  className={fieldClass}
                />
              </Field>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-[#e3e8f0]">
            <SectionHeader
              title="Other Settings"
              subtitle="Additional configurations for payroll processing."
              icon={FileText}
              tone="bg-[#f1e8fc] text-[#7b3fc4]"
            />
            <div className="grid grid-cols-2 gap-4 p-4">
              <Toggle
                label="Allow Negative Attendance"
                checked={structure.negativeAttendance}
                onChange={set('negativeAttendance')}
              />
              <Toggle label="Auto Process Payroll" checked={structure.autoProcess} onChange={set('autoProcess')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const bankColumns: Column[] = [
  { key: 'name', label: 'Bank Name', required: true },
  { key: 'ifsc', label: 'IFSC Code', required: true },
  { key: 'account', label: 'Account Number', required: true },
  { key: 'holder', label: 'Account Holder Name', required: true },
  { key: 'branch', label: 'Branch', required: true },
  { key: 'mode', label: 'Payment Mode', options: ['Bank Transfer', 'NEFT/RTGS', 'IMPS', 'UPI'] },
  { key: 'status', label: 'Status', options: ['Active', 'Inactive'] },
]

const defaultBanks: Row[] = [
  ['State Bank of India', 'SBIN0001234', '123456789012', 'Ramesh Kumar', 'Chennai Main', 'Bank Transfer'],
  ['HDFC Bank', 'HDFC0005678', '987654321098', 'Priya Nair', 'Bangalore', 'Bank Transfer'],
  ['ICICI Bank', 'ICIC0007890', '456789012345', 'Arun Singh', 'Hyderabad', 'Bank Transfer'],
  ['Axis Bank', 'UTIB0004321', '321098765432', 'Sneha Patel', 'Mumbai', 'Bank Transfer'],
  ['Canara Bank', 'CNRB0001122', '654321098765', 'Vikram Reddy', 'Chennai', 'NEFT/RTGS'],
].map(([name, ifsc, account, holder, branch, mode]) => ({
  id: ifsc,
  name,
  ifsc,
  account,
  holder,
  branch,
  mode,
  status: 'Active',
}))

const defaultPayment = {
  payMode: 'Bank Transfer',
  payCycle: 'Monthly',
  disbursementDay: '01',
  multipleAccounts: true,
  verifyAccount: true,
  confirmation: 'SMS & Email',
  processingDay: 'Last Working Day',
  fileTime: '18:00',
  releaseTime: '19:00',
  upi: true,
  autoReconcile: false,
  partialPayments: false,
  referenceFormat: 'PAY-{EMPID}-{MMYY}',
  minAmount: 1000,
  notify: true,
}

const days = Array.from({ length: 28 }, (_, i) => String(i + 1).padStart(2, '0'))

function PaymentBankDetails() {
  const [banks, setBanks] = useState(defaultBanks)
  const [payment, setPayment] = useState(defaultPayment)
  const [saved, setSaved] = useState(false)
  const set = <K extends keyof typeof defaultPayment>(key: K) => (value: (typeof defaultPayment)[K]) => {
    setPayment((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  return (
    <div>
      <PageHeader
        title="Payment & Bank Details"
        subtitle="Configure payment modes, bank details and related settings for employee salary disbursement."
        saved={saved}
        onReset={() => {
          setBanks(defaultBanks)
          setPayment(defaultPayment)
          setSaved(false)
        }}
        onSave={() => setSaved(true)}
      />

      <div className="space-y-4">
        <section className="overflow-hidden rounded-lg border border-[#e3e8f0]">
          <SectionHeader
            title="Payment Mode Configuration"
            subtitle="Define how salaries will be paid to employees and configure applicable settings."
            icon={ShieldCheck}
            tone="bg-[#e6f0fd] text-[#1976d2]"
          />
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Field label="Default Payment Mode" required>
              <Select value={payment.payMode} options={['Bank Transfer', 'NEFT/RTGS', 'Cheque', 'Cash']} onChange={set('payMode')} />
            </Field>
            <Field label="Payment Cycle" required>
              <Select value={payment.payCycle} options={['Monthly', 'Bi-Weekly', 'Weekly']} onChange={set('payCycle')} />
            </Field>
            <Field label="Salary Disbursement Date" required>
              <Select value={payment.disbursementDay} options={days} onChange={set('disbursementDay')} />
            </Field>
            <Toggle label="Allow Multiple Bank Accounts" checked={payment.multipleAccounts} onChange={set('multipleAccounts')} />
            <Toggle label="Require Bank Account Verification" checked={payment.verifyAccount} onChange={set('verifyAccount')} />
            <Field label="Payment Confirmation Method">
              <Select value={payment.confirmation} options={['SMS & Email', 'Email', 'SMS', 'None']} onChange={set('confirmation')} />
            </Field>
          </div>
        </section>

        <MasterTable
          title="Bank Account Details"
          subtitle="Manage bank details and validation rules for employee accounts."
          icon={Landmark}
          tone="bg-[#e3f5e8] text-[#2e7d32]"
          addLabel="Add Bank Details"
          columns={bankColumns}
          pillKeys={[]}
          rows={banks}
          onChange={(rows) => {
            setBanks(rows)
            setSaved(false)
          }}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="overflow-hidden rounded-lg border border-[#e3e8f0]">
            <SectionHeader
              title="Payment Process Schedule"
              subtitle="Set up the schedule for salary processing and bank file generation."
              icon={Clock}
              tone="bg-[#e6f0fd] text-[#1976d2]"
            />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <Field label="Salary Processing Day" required>
                <Select
                  value={payment.processingDay}
                  options={['Last Working Day', 'First Working Day', 'Fixed Date']}
                  onChange={set('processingDay')}
                />
              </Field>
              <Field label="Bank File Generation Time" required>
                <input type="time" value={payment.fileTime} onChange={(e) => set('fileTime')(e.target.value)} className={fieldClass} />
              </Field>
              <Field label="Payment Release Time" required>
                <input
                  type="time"
                  value={payment.releaseTime}
                  onChange={(e) => set('releaseTime')(e.target.value)}
                  className={fieldClass}
                />
              </Field>
              <p className="flex items-start gap-2 rounded-md border border-[#dbe6f5] bg-[#f5f9ff] p-3 text-[11px] text-[#555] sm:col-span-3">
                <Info className="h-4 w-4 shrink-0 text-[#1976d2]" />
                Bank file will be generated on the selected day and time. Ensure that all employee bank details are
                verified before the processing date.
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-[#e3e8f0]">
            <SectionHeader
              title="Additional Settings"
              subtitle="Configure additional payment and banking related preferences."
              icon={FileText}
              tone="bg-[#f1e8fc] text-[#7b3fc4]"
            />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Toggle label="Enable UPI Payments" checked={payment.upi} onChange={set('upi')} />
              <Field label="Payment Reference Format">
                <Select
                  value={payment.referenceFormat}
                  options={['PAY-{EMPID}-{MMYY}', 'SAL-{EMPID}-{YYYYMM}', '{EMPID}-{DDMMYY}']}
                  onChange={set('referenceFormat')}
                />
              </Field>
              <Toggle label="Auto Reconcile Bank Transactions" checked={payment.autoReconcile} onChange={set('autoReconcile')} />
              <Field label="Minimum Salary Amount for Bank Transfer (₹)">
                <NumberInput value={payment.minAmount} min={0} step={100} onChange={set('minAmount')} />
              </Field>
              <Toggle label="Allow Partial Payments" checked={payment.partialPayments} onChange={set('partialPayments')} />
              <Toggle label="Notify Employees on Payment" checked={payment.notify} onChange={set('notify')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-center">
      <Banknote className="h-10 w-10 text-[#c5cbd6]" strokeWidth={1.2} />
      <h2 className="text-[16px] font-semibold text-[#1a2340]">{title}</h2>
      <p className="text-[13px] text-[#888]">This section is not set up yet.</p>
    </div>
  )
}

export default function Masters() {
  const [tab, setTab] = useState(tabs[0].id)
  const [section, setSection] = useState(payrollSections[0].id)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visibleSections = payrollSections.filter((s) => s.label.toLowerCase().includes(q))
  const activeTab = tabs.find((t) => t.id === tab)!
  const activeSection = payrollSections.find((s) => s.id === section)!

  return (
    <div className="text-[#333]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1a2340]">Payroll Masters</h1>
          <p className="text-[13px] text-[#666]">
            Configure and manage payroll settings, employee details, and system preferences.
          </p>
        </div>
        <label className="relative w-full sm:w-[260px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#888]" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setTab('payroll')
            }}
            placeholder="Search settings..."
            className="h-10 w-full rounded-md border border-[#d1d5db] bg-white pr-3 pl-9 text-[13px] outline-none focus:border-[#1976d2]"
          />
        </label>
      </div>

      <div className="mb-4 flex overflow-x-auto rounded-lg border border-[#e3e8f0] bg-white">
        {tabs.map(({ id, label, icon: Icon }, i) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx(
              'relative flex shrink-0 items-center gap-2 px-5 py-4 text-[13px] whitespace-nowrap transition-colors',
              i > 0 && 'before:absolute before:top-1/2 before:left-0 before:h-6 before:-translate-y-1/2 before:border-l before:border-[#e3e8f0]',
              tab === id
                ? 'font-semibold text-[#1976d2] after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-[#1976d2]'
                : 'text-[#555] hover:text-[#1976d2]',
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'payroll' ? (
        <div className="flex flex-col gap-4 rounded-lg border border-[#e3e8f0] bg-white p-3 md:flex-row">
          <aside className="shrink-0 md:w-[170px] md:border-r md:border-[#e3e8f0] md:pr-3">
            <nav className="flex gap-1 overflow-x-auto md:flex-col">
              {visibleSections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={clsx(
                    'flex shrink-0 items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-[12px] whitespace-nowrap transition-colors',
                    section === id ? 'bg-[#eef5ff] font-medium text-[#1976d2]' : 'text-[#444] hover:bg-[#f5f6fa]',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  {label}
                </button>
              ))}
              {!visibleSections.length && <p className="px-2.5 py-2 text-[12px] text-[#888]">No settings found.</p>}
            </nav>
          </aside>
          <div className="min-w-0 flex-1">
            {section === 'configuration' ? <PayrollConfiguration /> : <ComingSoon title={activeSection.label} />}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[#e3e8f0] bg-white p-4">
          {tab === 'salary' ? (
            <SalaryDeductionMasters />
          ) : tab === 'payment' ? (
            <PaymentBankDetails />
          ) : (
            <ComingSoon title={activeTab.label} />
          )}
        </div>
      )}
    </div>
  )
}
