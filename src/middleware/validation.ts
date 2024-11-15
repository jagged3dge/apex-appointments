import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

export function validateAppointment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { startTime, endTime, patientId, patientName, doctorId, status } =
    req.body;

  if (
    !startTime ||
    !endTime ||
    !patientId ||
    !patientName ||
    !doctorId ||
    !status
  ) {
    throw new ApiError(400, 'Missing required fields');
  }

  if (new Date(startTime) >= new Date(endTime)) {
    throw new ApiError(400, 'Start time must be before end time');
  }

  if (!['confirmed', 'pending', 'cancelled', 'blocked'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  next();
}
