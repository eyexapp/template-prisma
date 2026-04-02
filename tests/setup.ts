import { execSync } from 'child_process'

/**
 * Vitest globalSetup — runs once before all test suites.
 *
 * Pushes the Prisma schema to the test database, creating or resetting
 * tables as needed. DATABASE_URL is already set to the test database
 * by dotenv-cli loading .env.test.
 */
export async function setup(): Promise<void> {
  execSync('npx prisma db push --force-reset --skip-generate', {
    stdio: 'inherit',
  })
}
