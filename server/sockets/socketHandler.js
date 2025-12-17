const gameSocket = require('./gameSocket');

function setupSockets(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        
        // Setup game-related socket events
        gameSocket(io, socket);
        
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
}

module.exports = { setupSockets };
