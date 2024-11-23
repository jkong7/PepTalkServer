import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './DB/connectDB.js';
import entryRoutes from './routes/entryRoutes.js';
import recapRoutes from './routes/recapRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
const app = express();

const allowedOrigins = [
    'https://peptalk-navy.web.app', // Firebase hosted app
    'http://localhost:5173', // Local development
];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));


app.use(express.json());

app.use('/backend/auth', authRoutes);
app.use('/backend/entry', entryRoutes);
app.use('/backend/recap', recapRoutes);

app.get('/', (req, res) => res.send('PepTalk Backend Running'));

app.get('/backend/entry/entry-data', (req, res) => {
    res.json({ message: 'Temporary test route working!' });
});


app.listen(process.env.PORT, () => {
    connectDB();
    console.log('Server is running on port', process.env.PORT);
});

//f