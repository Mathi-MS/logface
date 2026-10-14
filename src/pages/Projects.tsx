import { Link } from 'react-router-dom'

// TODO: replace mock data with API responses
type Series = { label: string; color: string; values: number[] }

type Project = {
  id: string
  name: string
  code: string
  units: number
  employees: number
  avgAttendance: number
  days: string[]
  series: Series[]
}

const projects: Project[] = [
  {
    id: 'pht88',
    name: 'ABC',
    code: 'PHT88',
    units: 1,
    employees: 21,
    avgAttendance: 26,
    days: ['14', '13', '12', '11', '10', '9', '8'],
    series: [
      { label: 'Present', color: '#7e57c2', values: [14, 9, 12, 0, 1, 10, 11] },
      { label: 'Late Entry', color: '#1fb5e3', values: [8, 3, 6, 0, 0, 2, 8] },
    ],
  },
]

const totalEmployees = projects.reduce((sum, p) => sum + p.employees, 0)
const overallAvg = projects.length
  ? Math.round(projects.reduce((sum, p) => sum + p.avgAttendance, 0) / projects.length)
  : 0

type Point = { x: number; y: number }

// Catmull-Rom spline through the points, converted to cubic beziers
function smoothPath(pts: Point[], tension = 0.4) {
  if (pts.length < 2) return ''
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + ((p2.x - p0.x) / 2) * tension
    const c1y = p1.y + ((p2.y - p0.y) / 2) * tension
    const c2x = p2.x - ((p3.x - p1.x) / 2) * tension
    const c2y = p2.y - ((p3.y - p1.y) / 2) * tension
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

function LineChart({ labels, series }: { labels: string[]; series: Series[] }) {
  const maxValue = Math.max(...series.flatMap((s) => s.values), 2)
  const yMax = Math.ceil(maxValue / 2) * 2
  const ticks = Array.from({ length: yMax / 2 + 1 }, (_, i) => i * 2)

  const W = 1150
  const H = 460
  const pad = { left: 38, right: 12, top: 10, bottom: 36 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const x = (i: number) => pad.left + (labels.length > 1 ? (i / (labels.length - 1)) * plotW : plotW / 2)
  const y = (v: number) => pad.top + plotH - (v / yMax) * plotH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[600px]" role="img" aria-label="Attendance for the last 7 days">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left - 6} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#e5e5e5" />
          <text x={pad.left - 12} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="15" fill="#555">
            {t}
          </text>
        </g>
      ))}
      {labels.map((label, i) => (
        <g key={label}>
          <line x1={x(i)} x2={x(i)} y1={pad.top} y2={pad.top + plotH + 6} stroke="#e5e5e5" />
          <text x={x(i)} y={pad.top + plotH + 24} textAnchor="middle" fontSize="15" fill="#555">
            {label}
          </text>
        </g>
      ))}
      <line x1={pad.left} x2={W - pad.right} y1={y(0)} y2={y(0)} stroke="#bbb" />

      {series.map((s) => {
        const pts = s.values.map((v, i) => ({ x: x(i), y: y(v) }))
        return (
          <g key={s.label}>
            <path d={smoothPath(pts)} fill="none" stroke={s.color} strokeWidth="3" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={s.color} stroke="#fff" strokeWidth="1">
                <title>{`${s.label} (${labels[i]}): ${s.values[i]}`}</title>
              </circle>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <section className="border border-[#d6d6d6] bg-white">
      <div className="px-[18px] pt-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[19px] font-medium leading-tight text-[#546e7a]">{project.name}</h2>
            <div className="text-[12px] font-medium text-[#555]">{project.code}</div>
          </div>
          <span className="pt-2 text-[12px] text-[#888]">{project.units} Units</span>
        </div>
        <div className="mt-1.5 flex gap-3 text-[13px]">
          <Link to="/employee" className="text-[#1976d2] hover:underline">
            {project.employees} Employees
          </Link>
          <span className="text-[#888]">{project.avgAttendance}% Avg.Attendance</span>
        </div>

        <div className="mt-4 overflow-x-auto pb-2">
          <LineChart labels={project.days} series={project.series} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#e5e5e5] px-[18px] py-3.5">
        <span className="text-[12px] text-[#888]">Last 7 Days</span>
        <div className="flex gap-5 text-[14px]">
          <Link to="/attendance" className="text-[#1565c0] hover:underline">
            Attendance
          </Link>
          <Link to={`/projects/${project.id}`} className="text-[#1565c0] hover:underline">
            Manage Project
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Projects() {
  return (
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,10fr)]">
      <aside className="border border-[#d6d6d6] bg-white text-[13px] lg:sticky lg:top-[80px]">
        <div className="border-b border-[#e5e5e5] px-5 py-5">
          <div className="text-[13px] font-medium text-[#222]">{projects.length} Active project</div>
          <button type="button" className="mt-1 text-[13px] text-[#1976d2] hover:underline">
            Add Project
          </button>
        </div>
        <div className="border-b border-[#e5e5e5] px-5 py-5 text-[#888]">
          {totalEmployees} Employees mapped across projects
        </div>
        <div className="px-5 py-5 text-[#888]">{overallAvg} % Overall Average Attendance</div>
      </aside>

      <div className="space-y-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  )
}
