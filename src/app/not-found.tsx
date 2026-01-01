import { ErrorPage } from '@/components/error-page'

export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="Page not found"
      message="We couldn't locate the page you were trying to reach. Double-check the address or return to your dashboard to continue."
      href="/dashboard"
      ctaLabel="Go to dashboard"
    />
  )
}
