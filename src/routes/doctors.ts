import express from 'express';
import { DoctorService } from '../services/doctorService';
import { getDatabase } from '../db';
import { ApiError } from '../middleware/errorHandler';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const doctorService = new DoctorService(db);

    const doctors = await doctorService.getDoctors({
      specialty: req.query.specialty as string,
      available: req.query.available === 'true',
    });

    res.json(doctors);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const doctorService = new DoctorService(db);

    const doctor = await doctorService.getDoctorById(req.params.id);
    res.json(doctor);
  } catch (err) {
    next(err);
  }
});

export default router;
