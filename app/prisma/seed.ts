import * as dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

// Lade Umgebungsvariablen aus .env Dateien
const envLocalPath = path.resolve(process.cwd(), '.env');
const envPath = path.resolve(process.cwd(), '.env');

try {
  if (require('fs').existsSync(envLocalPath)) {
    console.log('Loading environment from .env');
    dotenv.config({ path: envLocalPath });
  } else if (require('fs').existsSync(envPath)) {
    console.log('Loading environment from .env');
    dotenv.config({ path: envPath });
  } else {
    console.log('No .env or .env file found, using existing environment variables');
  }
} catch (error) {
  console.log('Error loading environment variables:', error as Error);
}

const prisma = new PrismaClient();

async function main() {
  // Lösche bestehende Daten in der richtigen Reihenfolge
  // Zuerst alle abhängigen Tabellen löschen
  await prisma.userActivity.deleteMany();
  await prisma.appointmentNote.deleteMany();
  await prisma.appointmentLog.deleteMany();
  await prisma.customerLog.deleteMany();
  await prisma.requestNote.deleteMany();
  await prisma.requestLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.userSession.deleteMany();
  
  // Dann die Haupttabellen löschen
  await prisma.contactRequest.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.systemSettings.deleteMany();
  
  // Zuletzt die Benutzer löschen
  await prisma.user.deleteMany();
  
  // Passwort-Hashing-Funktion
  const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
  };

  // Replace hardcoded admin and employee user data with environment variables or configuration
  const adminUserData = {
    name: process.env.ADMIN_NAME || 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: await hashPassword(process.env.ADMIN_PASSWORD || 'AdminPass123!'),
    role: 'admin',
    status: 'active',
    phone: process.env.ADMIN_PHONE || '+49 123 456 7890'
  };

  const employeeUserData = {
    name: process.env.EMPLOYEE_NAME || 'Max Mustermann',
    email: process.env.EMPLOYEE_EMAIL || 'max.mustermann@rising-bsm.com',
    password: await hashPassword(process.env.EMPLOYEE_PASSWORD || 'EmployeePassword123!'),
    role: 'employee',
    status: 'active',
    phone: process.env.EMPLOYEE_PHONE || '+49 987 654 3210'
  };

  // Use these objects in the user creation logic
  const adminUser = await prisma.user.create({
    data: adminUserData
  });

  const employeeUser = await prisma.user.create({
    data: employeeUserData
  });

  // User-Settings erstellen
  await prisma.userSettings.create({
    data: {
      userId: adminUser.id,
      darkMode: true,
      emailNotifications: true,
      pushNotifications: false,
      language: 'de',
      notificationInterval: 'immediate'
    }
  });

  await prisma.userSettings.create({
    data: {
      userId: employeeUser.id,
      darkMode: false,
      emailNotifications: true,
      pushNotifications: false,
      language: 'de',
      notificationInterval: 'immediate'
    }
  });
  
  // UserActivity für beide Benutzer erstellen
  await prisma.userActivity.create({
    data: {
      userId: adminUser.id,
      activity: 'Login',
      details: 'Erste Anmeldung',
      ipAddress: faker.internet.ipv4()
    }
  });
  
  await prisma.userActivity.create({
    data: {
      userId: employeeUser.id,
      activity: 'Profil aktualisiert',
      details: 'Profilbild hochgeladen',
      ipAddress: faker.internet.ipv4()
    }
  });

  // SystemSettings erstellen
  await prisma.systemSettings.create({
    data: {
      key: 'company_name',
      value: 'Rising BSM',
      description: 'Name des Unternehmens'
    }
  });
  
  await prisma.systemSettings.create({
    data: {
      key: 'email_sender',
      value: 'noreply@rising-bsm.com',
      description: 'Absender-E-Mail für System-Nachrichten'
    }
  });
  
  await prisma.systemSettings.create({
    data: {
      key: 'appointment_buffer',
      value: '30',
      description: 'Pufferzeit zwischen Terminen in Minuten'
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
          company: i % 3 === 0 ? faker.company.name() : undefined, // Nur ca. 1/3 mit Firmennamen
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          postalCode: faker.location.zipCode(),
          city: faker.location.city(),
          country: 'Deutschland',
          type: Math.random() > 0.5 ? 'private' : 'business',
          newsletter: faker.datatype.boolean(),
          status: 'active',
          createdBy: adminUser.id
        }
      })
    );
  }

  // Termine erstellen
  const appointments: any[] = [];
  for (let i = 0; i < 15; i++) {
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const futureDate = faker.date.future({ years: 0.2 });
    
    const appointment = await prisma.appointment.create({
      data: {
        title: `Termin mit ${randomCustomer.name}`,
        customerId: randomCustomer.id,
        appointmentDate: futureDate,
        duration: faker.number.int({ min: 30, max: 120 }),
        location: faker.helpers.arrayElement(['Büro', 'Online-Meeting', 'Beim Kunden', 'Café']),
        description: faker.lorem.sentences(2),
        status: faker.helpers.arrayElement(['planned', 'confirmed', 'completed', 'cancelled']),
        createdBy: faker.helpers.arrayElement([adminUser.id, employeeUser.id]) as number
      }
    });
    appointments.push(appointment);
    
    // AppointmentLog für jeden erstellten Termin
    await prisma.appointmentLog.create({
      data: {
        appointmentId: appointment.id,
        userId: appointment.createdBy as number,
        userName: appointment.createdBy === adminUser.id ? adminUser.name : employeeUser.name,
        action: 'Termin erstellt',
        details: `Termin für ${randomCustomer.name} am ${futureDate.toLocaleDateString()} angelegt`,
        createdAt: faker.date.recent({ days: 5 })
      }
    });
  }

  // Terminnotizen erstellen
  for (let i = 0; i < 10; i++) {
    const randomAppointment = appointments[Math.floor(Math.random() * appointments.length)];
    const userId = i % 2 === 0 ? adminUser.id : employeeUser.id;
    const userName = i % 2 === 0 ? adminUser.name : employeeUser.name;
    
    await prisma.appointmentNote.create({
      data: {
        appointmentId: randomAppointment.id,
        userId: userId,
        userName: userName,
        text: faker.lorem.paragraph(),
        createdAt: faker.date.recent({ days: 10 })
      }
    });
  }

  // Kundenaktivitäten erstellen
  for (let i = 0; i < 20; i++) {
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const actions = ['Kunde angelegt', 'Kunde aktualisiert', 'Notiz hinzugefügt', 'Termin vereinbart', 'E-Mail gesendet', 'Angebot erstellt'];
    const userId = i % 2 === 0 ? adminUser.id : employeeUser.id;
    const userName = i % 2 === 0 ? adminUser.name : employeeUser.name;
    
    await prisma.customerLog.create({
      data: {
        customerId: randomCustomer.id,
        userId: userId,
        userName: userName,
        action: actions[Math.floor(Math.random() * actions.length)],
        details: faker.lorem.sentence(),
        createdAt: faker.date.recent({ days: 30 })
      }
    });
  }

  // Benachrichtigungen erstellen
  for (let i = 0; i < 15; i++) {
    const notificationTypes = ['info', 'warning', 'success', 'error'];
    const referenceTypes = ['appointment', 'customer', 'system', 'user'];
    const isAppointmentRef = Math.random() > 0.6;
    
    // Explicitly define reference ID to ensure correct typing
    const refId: number | undefined = isAppointmentRef
      ? appointments[Math.floor(Math.random() * appointments.length)].id
      : Math.random() > 0.5 ? customers[Math.floor(Math.random() * customers.length)].id : undefined;
      
    // Explicitly define createdBy to ensure correct typing
    const createdById: number | undefined = Math.random() > 0.5 ? adminUser.id : undefined;
    
    await prisma.notification.create({
      data: {
        userId: i % 3 === 0 ? adminUser.id : employeeUser.id,
        referenceId: refId,
        referenceType: isAppointmentRef 
          ? 'appointment' 
          : referenceTypes[Math.floor(Math.random() * referenceTypes.length)],
        type: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
        title: faker.lorem.sentence(4),
        message: faker.lorem.sentences(2),
        description: Math.random() > 0.5 ? faker.lorem.paragraph() : undefined,
        read: Math.random() > 0.7,
        createdAt: faker.date.recent({ days: 14 }),
        createdBy: createdById
      }
    });
  }

  // Kontaktanfragen erstellen
  const contactRequests: any[] = [];
  for (let i = 0; i < 10; i++) {
    const services = ['Website-Entwicklung', 'SEO-Optimierung', 'Online-Marketing', 'App-Entwicklung', 'IT-Beratung'];
    const statuses = ['new', 'in_progress', 'completed', 'cancelled'];
    
    // Bei manchen Kontaktanfragen bereits einen Customer und Appointment verknüpfen
    const shouldLinkToCustomer = i < 5;
    const shouldCreateAppointment = i < 3;
    
    let customerId: number | undefined = undefined;
    let appointmentId: number | undefined = undefined;
    let processorId = Math.random() > 0.5 ? adminUser.id : employeeUser.id;
    
    if (shouldLinkToCustomer) {
      customerId = customers[i].id;
      
      if (shouldCreateAppointment) {
        // Finde einen passenden Termin
        for (const appt of appointments) {
          if (appt.customerId === customerId) {
            appointmentId = appt.id;
            break;
          }
        }
      }
    }
    
    const contactRequest = await prisma.contactRequest.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        service: services[Math.floor(Math.random() * services.length)],
        message: faker.lorem.paragraphs(1),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        processorId: processorId as number,
        customerId: customerId,  // Hier die Beziehung setzen
        appointmentId: appointmentId,  // Hier die Beziehung setzen
        ipAddress: faker.internet.ipv4(),
        createdAt: faker.date.recent({ days: 30 }),
        updatedAt: faker.date.recent({ days: 15 })
      }
    });
    
    // Für einige Anfragen auch Notizen hinzufügen
    if (i < 6) {
      const noteUserId = Math.random() > 0.5 ? adminUser.id : employeeUser.id;
      const noteUserName = noteUserId === adminUser.id ? adminUser.name : employeeUser.name;
      
      await prisma.requestNote.create({
        data: {
          requestId: contactRequest.id,
          userId: noteUserId,
          userName: noteUserName,
          text: faker.lorem.paragraph(),
          createdAt: faker.date.recent({ days: 10 })
        }
      });
    }
    
    // Für alle Anfragen Aktivitätslogs hinzufügen
    const logUserId = Math.random() > 0.5 ? adminUser.id : employeeUser.id;
    const logUserName = logUserId === adminUser.id ? adminUser.name : employeeUser.name;
    
    await prisma.requestLog.create({
      data: {
        requestId: contactRequest.id,
        userId: logUserId,
        userName: logUserName,
        action: 'Anfrage erstellt',
        details: 'Neue Kontaktanfrage über das Webformular',
        createdAt: faker.date.recent({ days: 30 })
      }
    });
    
    // Für bearbeitete Anfragen weitere Logs hinzufügen
    if (contactRequest.status !== 'new') {
      await prisma.requestLog.create({
        data: {
          requestId: contactRequest.id,
          userId: processorId as number,
          userName: processorId === adminUser.id ? adminUser.name : employeeUser.name,
          action: 'Status geändert',
          details: `Status auf "${contactRequest.status}" geändert`,
          createdAt: faker.date.recent({ days: 20 })
        }
      });
    }
    
    contactRequests.push(contactRequest);
  }

  console.log('Seeding abgeschlossen');
  console.log('Admin-Benutzer:', adminUser);
  console.log('Mitarbeiter-Benutzer:', employeeUser);
  console.log('Generierte Kunden:', customers.length);
  console.log('Generierte Termine:', appointments.length);
  console.log('Generierte Kontaktanfragen:', contactRequests.length);
  console.log('Generierte Systemeinstellungen: 3');
}

main()
  .catch((e) => {
    console.error('Seeding-Fehler:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
