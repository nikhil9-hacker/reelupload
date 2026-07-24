import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import instagramRoutes from './instagram.routes';
import driveRoutes from './google-drive.routes';
import googleRoutes from './google.routes';
import schedulerRoutes from './scheduler.routes';
import uploadRoutes from './uploads.routes';
import settingsRoutes from './settings.routes';
import dashboardRoutes from './dashboard.routes';

const v1Router = Router();

v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/instagram', instagramRoutes);
v1Router.use('/google-drive', driveRoutes);
v1Router.use('/google', googleRoutes);
v1Router.use('/scheduler', schedulerRoutes);
v1Router.use('/uploads', uploadRoutes);
v1Router.use('/settings', settingsRoutes);
v1Router.use('/dashboard', dashboardRoutes);

export default v1Router;
