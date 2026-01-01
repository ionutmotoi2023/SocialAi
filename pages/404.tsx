// Custom 404 page in Pages Router to prevent default generation

export default function Custom404() {
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
      <h1 style={{ fontSize: '6rem', margin: 0, color: '#3b82f6' }}>
        404
      </h1>
      <p style={{ fontSize: '1.5rem', color: '#666', marginTop: '1rem' }}>
        Page Not Found
      </p>
      <p style={{ fontSize: '1rem', color: '#999', marginTop: '0.5rem' }}>
        The page you're looking for doesn't exist.
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
