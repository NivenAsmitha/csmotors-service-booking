import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in .env');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const services = [
  {
    name: 'Free Service',
    description: 'Basic bike inspection and essential maintenance checks.',
    details: [
      'Engine oil level check',
      'Brake inspection',
      'Chain lubrication and adjustment',
      'Tyre pressure check',
      'Basic lights and horn check',
      'General safety inspection',
    ],
    duration_minutes: 60,
    max_bookings_per_slot: 1,
    is_active: true,
    slots: [
      ['Slot 1', '08:00', '09:00'],
      ['Slot 2', '09:00', '10:00'],
      ['Slot 3', '10:00', '11:00'],
      ['Slot 4', '11:00', '12:00'],
      ['Slot 5', '12:00', '13:00'],
      ['Slot 6', '13:00', '14:00'],
      ['Slot 7', '15:00', '16:00'],
      ['Slot 8', '16:00', '17:00'],
      ['Slot 9', '17:00', '18:00'],
      ['Slot 10', '18:00', '19:00'],
    ],
  },
  {
    name: 'Full Service',
    description:
      'Complete bike service with detailed inspection and adjustments.',
    details: [
      'Engine oil check or replacement support',
      'Air filter inspection',
      'Brake adjustment and inspection',
      'Chain cleaning, lubrication and adjustment',
      'Clutch and throttle play check',
      'Battery and lights inspection',
      'Tyre and wheel inspection',
      'Full safety inspection',
    ],
    duration_minutes: 90,
    max_bookings_per_slot: 2,
    is_active: true,
    slots: [
      ['Slot 1', '08:00', '09:30'],
      ['Slot 2', '09:30', '11:00'],
      ['Slot 3', '11:00', '12:30'],
      ['Slot 4', '12:30', '14:00'],
      ['Slot 5', '15:00', '16:30'],
      ['Slot 6', '16:30', '18:00'],
      ['Slot 7', '18:00', '19:30'],
    ],
  },
  {
    name: 'Super Service',
    description:
      'Premium full bike service with complete inspection and service care.',
    details: [
      'Complete bike inspection',
      'Engine performance check',
      'Brake system detailed inspection',
      'Chain and sprocket inspection',
      'Electrical system check',
      'Suspension and wheel check',
      'Final safety review',
    ],
    duration_minutes: 690,
    max_bookings_per_slot: 1,
    is_active: true,
    slots: [['Slot 1', '08:00', '19:30']],
  },
] as const;

function time(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

async function main() {
  const password_hash = await bcrypt.hash('Developer@123', 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: {
        email: 'developer@csmotorsservicebooking.lk',
      },
      update: {
        name: 'CS Motors Developer',
        phone: '0000000000',
        password_hash,
        role: UserRole.developer,
        is_active: true,
        must_change_password: false,
        email_verified: true,
      },
      create: {
        name: 'CS Motors Developer',
        email: 'developer@csmotorsservicebooking.lk',
        phone: '0000000000',
        password_hash,
        role: UserRole.developer,
        is_active: true,
        must_change_password: false,
        email_verified: true,
      },
    });

    for (const serviceData of services) {
      const { slots, ...serviceValues } = serviceData;
      const service = await tx.service.upsert({
        where: {
          name: serviceValues.name,
        },
        update: serviceValues,
        create: serviceValues,
      });

      for (const [label, start, end] of slots) {
        const slotValues = {
          label,
          start_time: time(start),
          end_time: time(end),
          is_default: true,
          show_time: true,
        };
        const existingSlot = await tx.timeSlot.findFirst({
          where: {
            service_id: service.id,
            label,
          },
        });

        if (existingSlot) {
          await tx.timeSlot.update({
            where: {
              id: existingSlot.id,
            },
            data: slotValues,
          });
        } else {
          await tx.timeSlot.create({
            data: {
              service_id: service.id,
              ...slotValues,
            },
          });
        }
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    console.error(
      'Database seeding failed. Review database connectivity and seed data.',
    );
    await prisma.$disconnect();
    process.exit(1);
  });
