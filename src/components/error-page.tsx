import Link from 'next/link'
import type { ReactNode } from 'react'

type ErrorPageProps = {
  code: string
  title: string
  message: string
  href?: string
  ctaLabel?: string
  actions?: ReactNode
}

export function ErrorPage({
  code,
  title,
  message,
  href,
  ctaLabel = 'Back to home',
  actions,
}: ErrorPageProps) {
  const showDefaultCta = !actions && href

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-16 text-center text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
          Social Media AI SaaS
        </p>
        <p className="text-6xl font-black tracking-tight text-slate-50 sm:text-7xl">
          {code}
        </p>
        <h1 className="text-2xl font-semibold text-slate-100 sm:text-3xl">
          {title}
        </h1>
        <p className="text-base leading-relaxed text-slate-300">
          {message}
        </p>
        <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
          {actions}
          {showDefaultCta && (
            <Link
              href={href}
              className="inline-flex items-center justify-center rounded-md bg-blue-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
