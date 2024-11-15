import { Database } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import { Doctor, Availability } from '../types';
import { getDatabase } from '../db';

export class DoctorService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getDoctors(
    params: { specialty?: string; available?: boolean } = {}
  ): Promise<Doctor[]> {
    let query = `
      SELECT 
        d.*,
        json_group_array(
          json_object(
            'weekday', da.weekday,
            'startTime', da.start_time,
            'endTime', da.end_time
          )
        ) as availability
      FROM doctors d
      LEFT JOIN doctor_availability da ON d.id = da.doctor_id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (params.specialty) {
      query += ' AND d.specialty = ?';
      queryParams.push(params.specialty);
    }

    query += ' GROUP BY d.id';

    if (params.available) {
      query += ' HAVING json_array_length(availability) > 0';
    }

    const doctors = await this.db.all<Doctor[]>(query, queryParams);
    return doctors.map((doctor) => ({
      ...doctor,
      availability: JSON.parse(doctor.availability as unknown as string),
    }));
  }

  async createDoctor(doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    const id = uuidv4();

    await this.db.run(
      'INSERT INTO doctors (id, name, specialty, avatar) VALUES (?, ?, ?, ?)',
      [id, doctor.name, doctor.specialty, doctor.avatar]
    );

    if (doctor.availability?.length) {
      const availabilityQuery = `
        INSERT INTO doctor_availability (doctor_id, weekday, start_time, end_time)
        VALUES ${doctor.availability.map(() => '(?, ?, ?, ?)').join(',')}
      `;
      const availabilityParams = doctor.availability.flatMap((availability) => [
        id,
        availability.weekday,
        availability.startTime,
        availability.endTime,
      ]);
      await this.db.run(availabilityQuery, availabilityParams);
    }

    return this.getDoctorById(id);
  }

  async getDoctorById(id: string): Promise<Doctor> {
    const doctor = await this.db.get<Doctor>(
      `SELECT 
        d.*,
        json_group_array(
          json_object(
            'weekday', da.weekday,
            'startTime', da.start_time,
            'endTime', da.end_time
          )
        ) as availability
      FROM doctors d
      LEFT JOIN doctor_availability da ON d.id = da.doctor_id
      WHERE d.id = ?
      GROUP BY d.id`,
      [id]
    );

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return {
      ...doctor,
      availability: JSON.parse(doctor.availability as unknown as string),
    };
  }
}
