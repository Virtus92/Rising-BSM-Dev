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
  // Lösche bestehende Daten in der richtigen Reihenfolge
  // Zuerst alle abhängigen Tabellen löschen
  await prisma.userActivity.deleteMany();
  await prisma.requestNote.deleteMany();
  await prisma.appointmentNote.deleteMany();
  await prisma.appointmentLog.deleteMany();
  await prisma.projectNote.deleteMany();
  await prisma.customerLog.deleteMany();
  await prisma.serviceLog.deleteMany();
  await prisma.requestLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userSettings.deleteMany();
  
  // Dann die Haupttabellen löschen
  await prisma.appointment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.project.deleteMany();
  await prisma.service.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.notification.deleteMany();
  
  // Zuletzt die Benutzer löschen
  await prisma.user.deleteMany();
  
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
          type: Math.random() > 0.5 ? 'private' : 'business',
          newsletter: faker.datatype.boolean(),
          status: 'active'
        }
      })
    );
  }

  // Services erstellen
  const services: any[] = [];
  const serviceNames = [
    'Website-Entwicklung',
    'SEO-Optimierung',
    'Social Media Marketing',
    'Content-Erstellung',
    'App-Entwicklung',
    'Hosting & Wartung'
  ];

  for (let i = 0; i < serviceNames.length; i++) {
    const service = await prisma.service.create({
      data: {
        name: serviceNames[i],
        description: faker.lorem.paragraph(),
        basePrice: faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }),
        active: true
      }
    });
    services.push(service);
  }

  // Projekte erstellen
  const projects: any[] = [];
  for (let i = 0; i < 10; i++) {
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const randomService = services[Math.floor(Math.random() * services.length)];
    const startDate = faker.date.recent({ days: 90 });
    const endDate = faker.date.future({ years: 0.5, refDate: startDate });
    
    const project = await prisma.project.create({
      data: {
        title: `Projekt für ${randomCustomer.name}`,
        customerId: randomCustomer.id,
        serviceId: randomService.id,
        startDate: startDate,
        endDate: Math.random() > 0.3 ? endDate : null,
        amount: faker.number.float({ min: 1000, max: 10000, fractionDigits: 2 }),
        description: faker.lorem.paragraphs(2),
        status: faker.helpers.arrayElement(['new', 'in_progress', 'completed', 'cancelled']),
        createdBy: adminUser.id
      }
    });
    projects.push(project);
  }

  // Termine erstellen
  const appointments: any[] = [];
  for (let i = 0; i < 15; i++) {
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const randomProject = i < 10 ? projects[i] : null;
    const futureDate = faker.date.future({ years: 0.2 });
    
    const appointment = await prisma.appointment.create({
      data: {
        title: `Termin mit ${randomCustomer.name}`,
        customerId: randomCustomer.id,
        projectId: randomProject?.id || null,
        appointmentDate: futureDate,
        duration: faker.number.int({ min: 30, max: 120 }),
        location: faker.helpers.arrayElement(['Büro', 'Online-Meeting', 'Beim Kunden', 'Café']),
        description: faker.lorem.sentences(2),
        status: faker.helpers.arrayElement(['planned', 'confirmed', 'completed', 'canceled']),
        createdBy: adminUser.id
      }
    });
    appointments.push(appointment);
  }

  // Kontaktanfragen erstellen
  const requests: any[] = [];
  for (let i = 0; i < 8; i++) {
    const randomService = services[Math.floor(Math.random() * services.length)];
    const request = await prisma.contactRequest.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        service: randomService.name,
        message: faker.lorem.paragraphs(1),
        status: faker.helpers.arrayElement(['new', 'in_progress', 'completed', 'cancelled']),
        createdAt: faker.date.recent({ days: 30 }),
        updatedAt: faker.date.recent({ days: 15 })
      }
    });
    requests.push(request);
  }

  // Rechnungen erstellen
  const invoices: any[] = [];
  for (let i = 0; i < 5; i++) {
    try {
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      const customerId = randomProject?.customerId;
      const projectAmount = randomProject?.amount || 1000; // Fallback-Wert falls amount undefined ist
      const invoiceDate = faker.date.recent({ days: 60 });
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 14); // Zahlungsziel 14 Tage
      
      // Erstelle zunächst die Rechnung
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${2023}-${1000 + i}`,
          projectId: randomProject.id,
          customerId: customerId,
          amount: projectAmount,
          vatAmount: projectAmount * 0.19, // 19% MwSt.
          totalAmount: projectAmount * 1.19,
          invoiceDate: invoiceDate,
          dueDate: dueDate,
          paidAt: Math.random() > 0.3 ? faker.date.between({ from: invoiceDate, to: dueDate }) : null,
          status: Math.random() > 0.3 ? 'paid' : 'open'
        }
      });
      
      // Füge ein Rechnungselement hinzu
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          serviceId: randomProject.serviceId || services[0].id,
          quantity: 1,
          unitPrice: projectAmount
        }
      });
      
      invoices.push(invoice);
    } catch (error) {
      console.error('Fehler beim Erstellen einer Rechnung:', error);
    }
  }

  console.log('Seeding abgeschlossen');
  console.log('Admin-Benutzer:', adminUser);
  console.log('Mitarbeiter-Benutzer:', employeeUser);
  console.log('Generierte Kunden:', customers.length);
  console.log('Generierte Services:', services.length);
  console.log('Generierte Projekte:', projects.length);
  console.log('Generierte Termine:', appointments.length);
  console.log('Generierte Anfragen:', requests.length);
  console.log('Generierte Rechnungen:', invoices.length);
}

main()
  .catch((e) => {
    console.error('Seeding-Fehler:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });