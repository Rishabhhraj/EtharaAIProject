export function validateEnv() {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET?.trim()) {
    console.error('FATAL: JWT_SECRET is required when NODE_ENV=production');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI?.trim()) {
    console.error('FATAL: MONGODB_URI is required when NODE_ENV=production');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL?.trim()) {
    console.warn(
      'WARN: CLIENT_URL is not set. Set it to your Railway app URL for strict CORS in production.'
    );
  }
}
