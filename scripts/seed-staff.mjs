import { createDb, users, hashPassword, eq } from '../packages/db/dist/index.js';

async function seedStaff() {
  const db = createDb();

  console.log('Seeding staff users with Argon2id passwords...');

  const staff = [
    {
      name: 'Suresh Kumar',
      phone: '+919876543210',
      email: 'suresh.desk@pavilionclub.in',
      role: 'desk',
      password: 'Desk@Pavilion2026',
    },
    {
      name: 'Anand Verma',
      phone: '+919876543211',
      email: 'anand.manager@pavilionclub.in',
      role: 'manager',
      password: 'Manager@Pavilion2026',
    },
    {
      name: 'Jayaraman (Owner)',
      phone: '+919876543212',
      email: 'jayaraman.offx@gmail.com',
      role: 'owner',
      password: 'Owner@Pavilion2026',
    },
  ];

  for (const s of staff) {
    const existing = await db.select().from(users).where(eq(users.phone, s.phone));
    const passwordHash = await hashPassword(s.password);

    if (existing.length === 0) {
      await db.insert(users).values({
        name: s.name,
        phone: s.phone,
        email: s.email,
        role: s.role,
        passwordHash,
        isActive: true,
      });
      console.log(`✓ Created staff: ${s.name} (${s.role}) - Phone: ${s.phone}`);
    } else {
      await db
        .update(users)
        .set({
          name: s.name,
          email: s.email,
          role: s.role,
          passwordHash,
          isActive: true,
        })
        .where(eq(users.phone, s.phone));
      console.log(`✓ Updated staff: ${s.name} (${s.role}) - Phone: ${s.phone}`);
    }
  }

  console.log('All staff users successfully seeded!');
  process.exit(0);
}

seedStaff().catch((err) => {
  console.error('Error seeding staff:', err);
  process.exit(1);
});
