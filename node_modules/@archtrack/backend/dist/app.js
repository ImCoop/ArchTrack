import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { documentRouter, invoiceRouter, quoteRouter, timeRouter } from './routes/business.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { customerRouter, projectRouter, taskRouter } from './routes/operations.routes.js';
import { setupRouter } from './routes/setup.routes.js';
import { userRouter } from './routes/user.routes.js';
export const createApp = () => {
    const app = express();
    app.use(helmet());
    app.use(cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }));
    app.use(cookieParser());
    app.use(express.json({ limit: '25mb' }));
    app.use('/api/v1/health', healthRouter);
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/setup', setupRouter);
    app.use('/api/v1/users', userRouter);
    app.use('/api/v1/customers', customerRouter);
    app.use('/api/v1/projects', projectRouter);
    app.use('/api/v1/tasks', taskRouter);
    app.use('/api/v1/notifications', notificationRouter);
    app.use('/api/v1/documents', documentRouter);
    app.use('/api/v1/time-entries', timeRouter);
    app.use('/api/v1/quotes', quoteRouter);
    app.use('/api/v1/invoices', invoiceRouter);
    app.use(errorMiddleware);
    return app;
};
