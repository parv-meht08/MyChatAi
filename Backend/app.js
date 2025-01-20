import express from 'express'
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

connect();

const app = express();

app.use(cors());
app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// Add security headers middleware
app.use((req, res, next) => {
    // Required for WebContainer
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
        "default-src 'self' https://*.webcontainer-api.io; " +
        "connect-src 'self' https://*.webcontainer-api.io ws://*.webcontainer-api.io; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.webcontainer-api.io; " +
        "worker-src 'self' blob: https://*.webcontainer-api.io; " +
        "style-src 'self' 'unsafe-inline'; " +
        "frame-src 'self' https://*.webcontainer-api.io;"
    );
    
    next();
});

// CORS configuration
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        /\.webcontainer-api\.io$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Cross-Origin-Embedder-Policy', 'Cross-Origin-Opener-Policy']
}));

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes)

app.get('/', (req,res)=> {
    res.send('Hello World');
})

export default app;
