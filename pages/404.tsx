import { ErrorPage } from '@/components/error-page'

export default function Custom404() {
  return (
    <ErrorPage
      code="404"
      title="Page not found"
      message="We couldn't locate the page you were trying to reach. Double-check the URL or return to your dashboard to continue your journey."
      href="/dashboard"
      ctaLabel="Go to dashboard"
    />
  )
}
