import express from 'express';
import { AppointmentService } from '../services/appointmentService';
import { getDatabase } from '../db';
import { ApiError } from '../middleware/errorHandler';
import { AppointmentStatus } from '../types';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const appointmentService = new AppointmentService(db);
    
    const appointments = await appointmentService.getAppointments({
      weekStart: req.query.weekStart as string,
      doctors: req.query.doctors as string[],
      status: req.query.status as AppointmentStatus[],
      search: req.query.search as string
    });
    
    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const appointmentService = new AppointmentService(db);
    
    const appointment = await appointmentService.createAppointment(req.body);
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const appointmentService = new AppointmentService(db);
    
    const appointment = await appointmentService.updateAppointment(
      req.params.id,
      req.body
    );
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const appointmentService = new AppointmentService(db);

    await appointmentService.deleteAppointment(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
