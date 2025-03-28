import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the path to the .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

// Load environment variables
dotenv.config({ path: envPath });

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Lösche bestehende Daten (optional, aber empfohlen)
  await prisma.userActivity.deleteMany();
  await prisma.requestNote.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();
  
  // Passwort-Hashing-Funktion
  const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
  };

  // Admin-Benutzer erstellen
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: await hashPassword('AdminPass123!'),
      role: 'admin',
      status: 'active',
      phone: '+49 123 456 7890'
    }
  });

  // Mitarbeiter-Benutzer erstellen
  const employeeUser = await prisma.user.create({
    data: {
      name: 'Max Mustermann',
      email: 'max.mustermann@rising-bsm.com',
      password: await hashPassword('EmployeePassword123!'),
      role: 'employee',
      status: 'active',
      phone: '+49 987 654 3210'
    }
  });

  // Kunden generieren
  const customers: any[] = [];
  for (let i = 0; i < 20; i++) {
    customers.push(
      await prisma.customer.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          company: faker.company.name(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          postalCode: faker.location.zipCode(),
          city: faker.location.city(),
          country: 'Deutschland',
          type: Math.random() > 0.5 ? 'privat' : 'geschaeft',
          newsletter: faker.datatype.boolean(),
          status: 'aktiv'
        }
      })
    );
  }

  console.log('Seeding abgeschlossen');
  console.log('Admin-Benutzer:', adminUser);
  console.log('Mitarbeiter-Benutzer:', employeeUser);
  console.log('Generierte Kunden:', customers.length);
}

main()
  .catch((e) => {
    console.error('Seeding-Fehler:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });