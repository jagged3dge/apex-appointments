import { getDatabase } from './index';
import { DoctorService } from '../services/doctorService';
import { AppointmentService } from '../services/appointmentService';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
  const db = await getDatabase();
  const doctorService = new DoctorService(db);
  const appointmentService = new AppointmentService(db);

  // Seed doctors
  const doctors = [
    {
      name: 'Dr. John Smith',
      specialty: 'Cardiology',
      availability: [
        { weekday: 1, startTime: '09:00', endTime: '17:00' },
        { weekday: 2, startTime: '09:00', endTime: '17:00' },
        { weekday: 3, startTime: '09:00', endTime: '17:00' },
      ],
    },
    {
      name: 'Dr. Sarah Johnson',
      specialty: 'Pediatrics',
      availability: [
        { weekday: 2, startTime: '09:00', endTime: '17:00' },
        { weekday: 4, startTime: '09:00', endTime: '17:00' },
        { weekday: 5, startTime: '09:00', endTime: '17:00' },
      ],
    },
  ];

  const createdDoctors = await Promise.all(
    doctors.map((doctor) => doctorService.createDoctor(doctor))
  );

  // Seed appointments
  const appointments = [
    {
      patientId: uuidv4(),
      patientName: 'Alice Brown',
      doctorId: createdDoctors[0].id,
      startTime: '2024-11-15T09:00:00.000Z',
      endTime: '2024-11-15T09:30:00.000Z',
      status: 'confirmed',
      lastModifiedBy: 'system',
    },
    {
      patientId: uuidv4(),
      patientName: 'Bob Wilson',
      doctorId: createdDoctors[1].id,
      startTime: '2024-11-15T10:00:00.000Z',
      endTime: '2024-11-15T10:30:00.000Z',
      status: 'pending',
      lastModifiedBy: 'system',
    },
  ];

  await Promise.all(
    appointments.map((appointment) =>
      appointmentService.createAppointment(appointment as any)
    )
  );

  console.log('Database seeded successfully');
  process.exit(0);
}

seedDatabase().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
