import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import appointmentsRouter from './routes/appointments';
import doctorsRouter from './routes/doctors';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/appointments', appointmentsRouter);
app.use('/api/doctors', doctorsRouter);

// Error handling
app.use(errorHandler);

export default app;
