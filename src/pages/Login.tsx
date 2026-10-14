import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const year = new Date().getFullYear()

type FloatingInputProps = {
  id: string
  label: string
  type?: string
  value: string
  autoComplete?: string
  autoFocus?: boolean
  onChange: (value: string) => void
}

function FloatingInput({ id, label, type = 'text', value, autoComplete, autoFocus, onChange }: FloatingInputProps) {
  return (
    <div className="relative pt-4">
      <input
        id={id}
        type={type}
        value={value}
        required
        placeholder=" "
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="peer h-[26px] w-full border-0 border-b border-[#8a8a8a] bg-transparent text-sm text-slate-900 outline-none transition-colors focus:border-b-2 focus:border-[#1565c0]"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-0 text-[10.5px] font-medium text-[#1976d2] transition-all peer-placeholder-shown:top-[19px] peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[#666] peer-focus:top-0 peer-focus:text-[10.5px] peer-focus:font-medium peer-focus:text-[#1976d2]"
      >
        {label} <span className="text-red-600">*</span>
      </label>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: replace with real authentication
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 pt-[133px] font-[Roboto,Helvetica,Arial,sans-serif] max-sm:pt-12">
      <div className="mx-auto w-full max-w-[452px]">
        <form onSubmit={handleSubmit} className="border border-[#d6d6d6] bg-white px-10 pb-7 pt-7 max-sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/logo-single.png" alt="" className="h-[35px] w-auto" />
            <span className="text-[22px] text-[#666]">Logface</span>
          </div>

          <div className="mt-[30px] space-y-[18px]">
            <FloatingInput
              id="username"
              label="Username"
              value={username}
              autoComplete="username"
              autoFocus
              onChange={setUsername}
            />
            <FloatingInput
              id="password"
              label="Password"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={setPassword}
            />
          </div>

          <Link to="/forgot-password" className="mt-5 inline-block text-[13px] text-[#1976d2] hover:underline">
            Forgot password?
          </Link>

          <div className="mt-1 flex justify-end">
            <button
              type="submit"
              className="h-[31px] border border-[#1976d2] px-[10px] text-[13px] text-[#1976d2] transition-colors hover:bg-[#1976d2] hover:text-white"
            >
              Log in
            </button>
          </div>
        </form>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-[13px] text-[#333]">© {year} - Cindrel</span>
          <a href="https://cindrel.com/" className="text-xs text-[#1976d2] hover:underline" target="_blank">
            About Cindrel
          </a>
        </div>
      </div>
    </div>
  )
}
