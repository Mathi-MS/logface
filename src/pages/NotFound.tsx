import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="py-24 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-slate-600">Page not found.</p>
      <Link to="/" className="mt-6 inline-block text-indigo-600 hover:underline">
        Go home
      </Link>
    </section>
  )
}
