'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-16 text-center text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
          Social Media AI SaaS
        </p>
        <p className="text-6xl font-black tracking-tight text-slate-50 sm:text-7xl">500</p>
        <h1 className="text-2xl font-semibold text-slate-100 sm:text-3xl">
          Something went wrong
        </h1>
        <p className="text-base leading-relaxed text-slate-300">
          An unexpected error occurred while processing your request. Try again or jump back to your dashboard.
        </p>
        <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-white/10 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-white/10 transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-blue-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
