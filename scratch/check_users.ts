import { db } from './api/_lib/db';
import { users } from './db/schema';

async function main() {
  const allUsers = await db.select().from(users);
  console.log('Users:', allUsers.map(u => ({ email: u.email, role: u.role })));
  process.exit(0);
}

main().catch(console.error);
