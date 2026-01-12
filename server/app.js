require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const routes = require('./routes');
const { setupSockets } = require('./sockets/socketHandler');
const { getClientUrl } = require('./utils/urlHelper');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const clientUrl = getClientUrl();

app.use(cors({
    origin: clientUrl,
    credentials: true
}));

app.set('trust proxy', 1);

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

app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({ message: 'Dungeon Crawler API is running!' });
});

app.use(errorHandler);

const io = new Server(server, {
    cors: {
        origin: clientUrl,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

setupSockets(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
