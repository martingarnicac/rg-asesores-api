import { registerAs } from '@nestjs/config';

function parseOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export default registerAs('cors', () => ({
  origins: parseOrigins(process.env.CORS_ORIGINS),
}));
