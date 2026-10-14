import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { Checkbox, FilterBox } from '../components/CheckboxFilter'
import { toggle } from '../lib/toggle'
import { employees, type Employee, type Gender } from '../data/employees'

// Status filters; employees without a backing field never match (flag not available yet)
const statusFilters: { label: string; test?: (e: Employee) => boolean }[] = [
  { label: 'Unit not mapped', test: (e) => !e.unit },
  { label: 'Face enrolled', test: (e) => e.faceEnrolled },
  { label: 'Face not enrolled', test: (e) => !e.faceEnrolled },
  { label: 'Roaming' },
  { label: 'Regular' },
  { label: 'No unit', test: (e) => !e.unit },
  { label: 'Mobile permission', test: (e) => e.mobile },
  { label: 'Web permission', test: (e) => e.web },
  { label: 'Travel enabled', test: (e) => e.travel },
  { label: 'No mobile number' },
  { label: 'Single user' },
  { label: 'Multi user' },
  { label: 'Multi user controller' },
  { label: 'Reporting person' },
  { label: 'QR mapped' },
  { label: 'Bypassed QR units' },
]

const uniqueSorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b))
const services = uniqueSorted(employees.map((e) => e.service))
const designations = uniqueSorted(employees.map((e) => e.designation))
const genders: Gender[] = ['Male', 'Female']
const DESIGNATIONS_PREVIEW = 6

function EmployeeCard({ employee }: { employee: Employee }) {
  const tags = [employee.unit ?? 'No unit', employee.mobile && 'Mobile', employee.web && 'Web', employee.travel && 'Travel'].filter(
    Boolean,
  )

  return (
    <Link
      to={`/employee/${encodeURIComponent(employee.code)}`}
      className="block border border-[#d6d6d6] bg-white px-5 pb-4 pt-5 text-center transition-shadow hover:border-[#b9c4d2] hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#1976d2]"
    >
      <div className="text-left text-[12px] text-[#1976d2]">{employee.code}</div>
      <Avatar variant={employee.gender === 'Female' ? 'female' : 'male'} className="mx-auto mt-2 h-[88px] w-[88px]" />
      <h3 className="mt-4 text-[18px] text-[#222]">{employee.name}</h3>
      <div className="mt-0.5 text-[14px] leading-[22px] text-[#888]">{employee.designation}</div>
      <div className="text-[14px] leading-[22px] text-[#888]">{employee.service}</div>
      <div className="mt-1 text-[12px] font-medium text-[#777]">{tags.join(' • ')}</div>
    </Link>
  )
}

export default function EmployeePage() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])
  const [selServices, setSelServices] = useState<string[]>([])
  const [selDesignations, setSelDesignations] = useState<string[]>([])
  const [selGenders, setSelGenders] = useState<Gender[]>([])
  const [showRelieved, setShowRelieved] = useState(false)
  const [showAllDesignations, setShowAllDesignations] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const activeTests = statusFilters.filter((f) => statuses.includes(f.label))
    return employees.filter(
      (e) =>
        e.relieved === showRelieved &&
        (!q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)) &&
        activeTests.every((f) => f.test?.(e) ?? false) &&
        (!selServices.length || selServices.includes(e.service)) &&
        (!selDesignations.length || selDesignations.includes(e.designation)) &&
        (!selGenders.length || selGenders.includes(e.gender)),
    )
  }, [search, statuses, selServices, selDesignations, selGenders, showRelieved])

  const visibleDesignations = showAllDesignations ? designations : designations.slice(0, DESIGNATIONS_PREVIEW)
  const hiddenCount = designations.length - DESIGNATIONS_PREVIEW

  return (
    <div>
      <h1 className="text-[18px] text-[#333]">Employee across all projects</h1>

      <form
        className="mt-3 flex max-w-[580px]"
        onSubmit={(e) => {
          e.preventDefault()
          setSearch(query)
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value) setSearch('')
          }}
          placeholder="Search employee name, code"
          className="h-[38px] min-w-0 flex-1 border border-[#d6d6d6] bg-white px-5 text-[14px] text-[#222] outline-none placeholder:text-[#aaa] focus:border-[#1976d2]"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex h-[38px] w-[48px] items-center justify-center border border-l-0 border-[#d6d6d6] bg-[#f0f0f0] text-[#555] hover:bg-[#e5e5e5]"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,10fr)]">
        <aside className="space-y-4">
          <FilterBox
            header={
              <Checkbox label={`All ${employees.length} employees`} checked={!statuses.length} onChange={() => setStatuses([])} />
            }
          >
            {statusFilters.map((f) => (
              <Checkbox
                key={f.label}
                label={f.label}
                checked={statuses.includes(f.label)}
                onChange={() => setStatuses((s) => toggle(s, f.label))}
              />
            ))}
          </FilterBox>

          <FilterBox
            header={
              <Checkbox label={`All ${services.length} service`} checked={!selServices.length} onChange={() => setSelServices([])} />
            }
          >
            {services.map((s) => (
              <Checkbox key={s} label={s} checked={selServices.includes(s)} onChange={() => setSelServices((v) => toggle(v, s))} />
            ))}
          </FilterBox>

          <FilterBox
            header={
              <Checkbox
                label={`All ${designations.length} designation`}
                checked={!selDesignations.length}
                onChange={() => setSelDesignations([])}
              />
            }
          >
            {visibleDesignations.map((d) => (
              <Checkbox
                key={d}
                label={d}
                checked={selDesignations.includes(d)}
                onChange={() => setSelDesignations((v) => toggle(v, d))}
              />
            ))}
            {hiddenCount > 0 && (
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowAllDesignations((v) => !v)}
                  className="text-[13px] text-[#1976d2] hover:underline"
                >
                  {showAllDesignations ? 'Show less' : `+ ${hiddenCount} more`}
                </button>
              </div>
            )}
          </FilterBox>

          <FilterBox header={<div className="text-[13px] text-[#333]">Gender</div>}>
            {genders.map((g) => (
              <Checkbox key={g} label={g} checked={selGenders.includes(g)} onChange={() => setSelGenders((v) => toggle(v, g))} />
            ))}
          </FilterBox>

          <FilterBox header={<Checkbox label="Relieved" checked={showRelieved} onChange={() => setShowRelieved((v) => !v)} />} />

          <div className="border border-[#d6d6d6] bg-[#e0e0e0] px-5 py-5 text-center">
            <button
              type="button"
              className="h-[32px] border border-[#1976d2] bg-white px-3 text-[13px] text-[#1976d2] transition-colors hover:bg-[#1976d2] hover:text-white"
            >
              Add Employee
            </button>
            <button type="button" className="mt-4 block w-full text-[14px] leading-[21px] text-[#1565c0] hover:underline">
              Bulk upload employees via excel sheet
            </button>
          </div>
        </aside>

        <div>
          {filtered.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((e) => (
                <EmployeeCard key={e.code} employee={e} />
              ))}
            </div>
          ) : (
            <div className="border border-[#d6d6d6] bg-white px-5 py-12 text-center text-[14px] text-[#888]">
              No employees match the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
