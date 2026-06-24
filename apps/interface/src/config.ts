import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  CLAUDE_COMMAND: z.string().default('claude'),
  TIMEOUT: z.coerce.number().default(3600),
});

const parsed = Env.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const config = parsed.data;
