import type { ReactNode } from 'react'

// Checkbox filter boxes used in the left column of the Employee and Payroll pages

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-[7px] text-[13px] text-[#222]" title={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-[15px] w-[15px] shrink-0 cursor-pointer accent-[#1976d2]"
      />
      <span className="truncate">{label}</span>
    </label>
  )
}

export function FilterBox({ header, children }: { header: ReactNode; children?: ReactNode }) {
  return (
    <div className="border border-[#d6d6d6] bg-white px-5 py-5">
      <div className={children ? 'border-b border-[#e5e5e5] pb-3' : undefined}>{header}</div>
      {children && <div className="pt-3">{children}</div>}
    </div>
  )
}
