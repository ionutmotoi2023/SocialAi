/**
 * Environment variables wrapper - Railway safe mode
 * Previne crash-uri când variabilele lipsesc
 */

const getEnvVar = (key: string, fallback: string = ''): string => {
  // Încearcă mai întâi din next.config.js env
  const fromNextConfig = (global as any).env?.[key];
  if (fromNextConfig) {
    return fromNextConfig;
  }
  
  // Apoi din process.env
  const fromProcess = process.env[key];
  if (fromProcess) {
    return fromProcess;
  }
  
  // Fallback pentru development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`⚠️ Missing environment variable: ${key}, using fallback`);
    return fallback;
  }
  
  // Pentru production, returnează fallback dar loghează eroare
  if (process.env.NODE_ENV === 'production') {
    console.error(`❌ Missing environment variable: ${key}, using fallback - this may cause issues!`);
    return fallback;
  }
  
  return fallback;
};

// Exportă variabilele cu fallback-uri sigure
export const env = {
  // NextAuth.js
  NEXTAUTH_URL: getEnvVar('NEXTAUTH_URL', 'http://localhost:3000'),
  NEXTAUTH_SECRET: getEnvVar('NEXTAUTH_SECRET', 'development-secret-key-min-32-chars-here'),
  
  // OpenAI
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY', 'sk-dummy-key-for-build-only'),
  
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL', 'file:./dev.db'),
  
  // JWT
  JWT_SECRET: getEnvVar('JWT_SECRET', 'jwt-development-secret-key-here'),
  
  // Email
  SMTP_HOST: getEnvVar('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT: getEnvVar('SMTP_PORT', '587'),
  SMTP_USER: getEnvVar('SMTP_USER', 'test@example.com'),
  SMTP_PASS: getEnvVar('SMTP_PASS', 'test-password'),
  
  // Stripe
  STRIPE_SECRET_KEY: getEnvVar('STRIPE_SECRET_KEY', 'sk_test_dummy'),
  WEBHOOK_SECRET: getEnvVar('WEBHOOK_SECRET', 'whsec_dummy'),
  
  // Railway specific
  RAILWAY_ENVIRONMENT: getEnvVar('RAILWAY_ENVIRONMENT', 'development'),
  RAILWAY_SERVICE_ID: getEnvVar('RAILWAY_SERVICE_ID', 'local'),
  
  // Build safety
  NEXT_BUILD_SKIP_ENV_VALIDATION: getEnvVar('NEXT_BUILD_SKIP_ENV_VALIDATION', 'true'),
};

// Helper functions pentru validare
export const isDevelopment = (): boolean => process.env.NODE_ENV === 'development';
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
export const isRailway = (): boolean => !!process.env.RAILWAY_ENVIRONMENT;

// Verifică dacă avem variabilele critice
export const validateCriticalEnvVars = (): { valid: boolean; missing: string[] } => {
  const criticalVars = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'DATABASE_URL'];
  const missing: string[] = [];
  
  criticalVars.forEach(varName => {
    if (!env[varName as keyof typeof env] || env[varName as keyof typeof env] === 'dummy') {
      missing.push(varName);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
};

// Log status la inițializare
if (typeof window === 'undefined') {
  console.log('🔧 Environment variables loaded');
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`☁️  Railway: ${isRailway() ? 'yes' : 'no'}`);
  
  const validation = validateCriticalEnvVars();
  if (!validation.valid && isProduction()) {
    console.error('❌ Missing critical environment variables:', validation.missing);
  } else if (!validation.valid) {
    console.warn('⚠️  Missing environment variables (development mode):', validation.missing);
  }
}