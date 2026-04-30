import { db } from './api/_lib/db';
import { users } from './db/schema';

async function main() {
  try {
    const allUsers = await db.select().from(users);
    console.log('Users:', allUsers.map(u => ({ email: u.email, role: u.role })));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

main();
