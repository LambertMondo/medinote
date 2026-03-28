import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ||
    'postgresql://medinote:medinote_dev@localhost:5432/medinote',
}));
