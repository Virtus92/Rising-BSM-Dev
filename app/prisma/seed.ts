// seed.ts
import * as dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';
import { faker } from '@faker-js/faker';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer);
  }));
}

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function main() {
  await prisma.userActivity.deleteMany();
  await prisma.appointmentNote.deleteMany();
  await prisma.appointmentLog.deleteMany();
  await prisma.customerLog.deleteMany();
  await prisma.requestNote.deleteMany();
  await prisma.requestLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.user.deleteMany();

  const adminName = await askQuestion('Admin Name: ');
  const adminEmail = await askQuestion('Admin Email: ');
  const adminPasswordRaw = await askQuestion('Admin Passwort: ');
  const hash = await hashPassword(adminPasswordRaw);

  const adminUser = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hash,
      role: 'admin',
      status: 'active',
      phone: '+49 123 456 7890'
    }
  });

  const addDemoData = (await askQuestion('Demo-Daten hinzufügen? (j/n): ')).toLowerCase();
  if (addDemoData !== 'j') {
    console.log('Admin erstellt, keine Demo-Daten geladen.');
    return;
  }

  // Demo-Mitarbeiter erstellen
  const employeeUser = await prisma.user.create({
    data: {
      name: 'Max Mustermann',
      email: 'employee@demo.com',
      password: await hashPassword('Employee123!'),
      role: 'employee',
      status: 'active',
      phone: '+49 987 654 3210'
    }
  });

  const customers = [];
  for (let i = 0; i < 10; i++) {
    customers.push(await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email() ?? 'demo@example.com',
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        postalCode: faker.location.zipCode(),
        city: faker.location.city(),
        country: 'Deutschland',
        type: i % 2 === 0 ? 'PRIVATE' : 'BUSINESS',
        newsletter: faker.datatype.boolean(),
        status: 'ACTIVE',
        createdBy: adminUser.id
      }
    }));
  }

  for (const customer of customers) {
    const appointment = await prisma.appointment.create({
      data: {
        title: `Besprechung mit ${customer.name}`,
        customerId: customer.id,
        appointmentDate: faker.date.future({ years: 0.1 }),
        duration: 60,
        location: 'Online',
        description: 'Demotermin',
        status: 'CONFIRMED',
        createdBy: adminUser.id
      }
    });

    await prisma.contactRequest.create({
      data: {
        name: customer.name,
        email: customer.email ?? 'demo@example.com',
        phone: customer.phone,
        service: 'Beratung',
        message: 'Ich habe Interesse an einer Zusammenarbeit.',
        status: 'NEW',
        processorId: employeeUser.id,
        customerId: customer.id,
        appointmentId: appointment.id,
        ipAddress: faker.internet.ipv4()
      }
    });
  }

  console.log('Admin und konsistente Demo-Daten erfolgreich erstellt.');
}

main()
  .catch((e) => {
    console.error('Fehler beim Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
