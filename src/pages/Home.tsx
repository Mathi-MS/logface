import { ScanFace } from 'lucide-react'

export default function Home() {
  return (
    <section className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="rounded-2xl bg-indigo-50 p-5">
        <ScanFace className="h-12 w-12 text-indigo-600" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">Welcome to Logface</h1>
      <p className="max-w-xl text-slate-600">
        Your React + Vite + TypeScript + Tailwind app is ready. Start building in{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">src/pages</code>.
      </p>
    </section>
  )
}
