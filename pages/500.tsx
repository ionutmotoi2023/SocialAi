import { ErrorPage } from '@/components/error-page'

export default function Custom500() {
  return (
    <ErrorPage
      code="500"
      title="Something went wrong"
      message="An unexpected error occurred while processing your request. Please try again in a moment or head back to your dashboard."
      href="/dashboard"
      ctaLabel="Return to dashboard"
    />
  )
}
