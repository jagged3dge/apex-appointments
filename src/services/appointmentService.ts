import { Database } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import { Appointment, AppointmentStatus } from '../types';
import { getDatabase } from '../db';

export class AppointmentService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAppointments(params: {
    weekStart?: string;
    doctors?: string[];
    status?: AppointmentStatus[];
    search?: string;
  }): Promise<Appointment[]> {
    let query = `
      SELECT 
        a.*,
        rp.frequency,
        rp.interval_value,
        rp.end_date
      FROM appointments a
      LEFT JOIN recurring_patterns rp ON a.recurring_pattern_id = rp.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (params.weekStart) {
      query += ` AND date(a.start_time) >= date(?) AND date(a.start_time) < date(?, '+7 days')`;
      queryParams.push(params.weekStart, params.weekStart);
    }

    if (params.doctors?.length) {
      query += ` AND a.doctor_id IN (${params.doctors
        .map(() => '?')
        .join(',')})`;
      queryParams.push(...params.doctors);
    }

    if (params.status?.length) {
      query += ` AND a.status IN (${params.status.map(() => '?').join(',')})`;
      queryParams.push(...params.status);
    }

    if (params.search) {
      query += ` AND (a.patient_name LIKE ? OR EXISTS (
        SELECT 1 FROM doctors d WHERE d.id = a.doctor_id AND d.name LIKE ?
      ))`;
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY a.start_time ASC';

    const appointments = await this.db.all<Appointment[]>(query, queryParams);
    return appointments;
  }

  async createAppointment(
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
    const id = uuidv4();
    const now = new Date().toISOString();

    let recurringPatternId: string | null = null;
    if (appointment.recurring) {
      recurringPatternId = uuidv4();
      await this.db.run(
        `INSERT INTO recurring_patterns (id, frequency, interval_value, end_date)
         VALUES (?, ?, ?, ?)`,
        [
          recurringPatternId,
          appointment.recurring.frequency,
          appointment.recurring.interval,
          appointment.recurring.endDate,
        ]
      );

      if (appointment.recurring.exceptions?.length) {
        const exceptionsQuery = `
          INSERT INTO recurring_exceptions (pattern_id, exception_date)
          VALUES ${appointment.recurring.exceptions
            .map(() => '(?, ?)')
            .join(',')}
        `;
        const exceptionsParams = appointment.recurring.exceptions.flatMap(
          (exception) => [recurringPatternId, exception]
        );
        await this.db.run(exceptionsQuery, exceptionsParams);
      }
    }

    await this.db.run(
      `INSERT INTO appointments (
        id, patient_id, patient_name, doctor_id, start_time, end_time,
        status, notes, created_at, updated_at, last_modified_by, recurring_pattern_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        appointment.patientId,
        appointment.patientName,
        appointment.doctorId,
        appointment.startTime,
        appointment.endTime,
        appointment.status,
        appointment.notes,
        now,
        now,
        appointment.lastModifiedBy,
        recurringPatternId,
      ]
    );

    return this.getAppointmentById(id);
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const appointment = await this.db.get<Appointment>(
      `SELECT 
        a.*,
        rp.frequency,
        rp.interval_value,
        rp.end_date
      FROM appointments a
      LEFT JOIN recurring_patterns rp ON a.recurring_pattern_id = rp.id
      WHERE a.id = ?`,
      [id]
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  }

  async updateAppointment(
    id: string,
    updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>
  ): Promise<Appointment> {
    const now = new Date().toISOString();
    const updateFields = Object.keys(updates)
      .filter((key) => key !== 'recurring')
      .map((key) => `${key} = ?`);

    const updateValues = Object.entries(updates)
      .filter(([key]) => key !== 'recurring')
      .map(([, value]) => value);

    await this.db.run(
      `UPDATE appointments 
       SET ${updateFields.join(', ')}, updated_at = ?
       WHERE id = ?`,
      [...updateValues, now, id]
    );

    if (updates.recurring) {
      const appointment = await this.getAppointmentById(id);
      if (appointment.recurring) {
        await this.db.run(
          `UPDATE recurring_patterns
           SET frequency = ?, interval_value = ?, end_date = ?
           WHERE id = ?`,
          [
            updates.recurring.frequency,
            updates.recurring.interval,
            updates.recurring.endDate,
            appointment.recurring,
          ]
        );
      }
    }

    return this.getAppointmentById(id);
  }

  async deleteAppointment(id: string): Promise<void> {
    const appointment = await this.getAppointmentById(id);

    if (appointment.recurring) {
      await this.db.run(
        'DELETE FROM recurring_exceptions WHERE pattern_id = ?',
        [appointment.recurring]
      );
      await this.db.run('DELETE FROM recurring_patterns WHERE id = ?', [
        appointment.recurring,
      ]);
    }

    await this.db.run('DELETE FROM appointments WHERE id = ?', [id]);
  }
}
