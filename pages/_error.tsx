// Custom _error page to prevent Next.js from generating default error pages
// that import <Html> component incorrectly

import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode?: number
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0, color: '#333' }}>
        {statusCode || 'Error'}
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginTop: '1rem' }}>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
      <a 
        href="/dashboard" 
        style={{
          marginTop: '2rem',
          padding: '0.75rem 2rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontWeight: 500
        }}
      >
        Go to Dashboard
      </a>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
