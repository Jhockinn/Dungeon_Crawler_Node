require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const routes = require('./routes');
const { setupSockets } = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

// CORS configuration for credentials
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Trust proxy (important for sessions)
app.set('trust proxy', 1);

// Session middleware
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 
    }
});

app.use(sessionMiddleware);

// Body parser
app.use(express.json());

// Routes
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Dungeon Crawler API is running!' });
});

// Socket.IO setup with session support
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Share session with Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

setupSockets(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
