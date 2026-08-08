import { auth } from "@/lib/auth-server";

export function parseArgs(argv: string[]): { email: string; password: string; name: string } {
  const [email, password, name] = argv;
  if (!email || !password) {
    throw new Error('Usage: npm run create-user -- <email> <password> "<name>"');
  }
  return { email, password, name: name ?? email };
}

async function main() {
  const { email, password, name } = parseArgs(process.argv.slice(2));
  await auth.api.signUpEmail({ body: { email, password, name } });
  console.log(`Created user ${email}`);
}

// Only run when invoked directly, not when imported by tests.
if (process.argv[1] && process.argv[1].endsWith("create-user.ts")) {
  main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
