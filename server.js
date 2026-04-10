const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// State management
// rooms = { [roomId]: { status: 'AVAILABLE' | 'OCCUPIED', displayId: socketId, controllerId: socketId } }
const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Display client creates/joins as host
    socket.on('create_room', (roomId) => {
        rooms[roomId] = {
            status: 'AVAILABLE',
            displayId: socket.id,
            controllerId: null
        };
        socket.join(roomId);
        console.log(`Room created: ${roomId} by display ${socket.id}`);
    });

    // Mobile controller joins a room
    socket.on('join_room', (roomId) => {
        const room = rooms[roomId];

        if (!room) {
            socket.emit('access_denied', 'Room does not exist.');
            return;
        }

        if (room.status === 'OCCUPIED') {
            socket.emit('access_denied', 'Game in progress, please wait.');
            return;
        }

        // Assign controller to room
        room.status = 'OCCUPIED';
        room.controllerId = socket.id;
        socket.join(roomId);
        console.log(`Controller ${socket.id} joined room ${roomId}`);
        socket.emit('join_success');

        // Notify display that a player joined
        if (room.displayId) {
            io.to(room.displayId).emit('player_joined');
        }
    });

    // Event relay from Controller to Display
    socket.on('move_left', (roomId) => {
        const room = rooms[roomId];
        if (room && room.controllerId === socket.id && room.displayId) {
            io.to(room.displayId).emit('move_left');
        }
    });

    socket.on('move_right', (roomId) => {
        const room = rooms[roomId];
        if (room && room.controllerId === socket.id && room.displayId) {
            io.to(room.displayId).emit('move_right');
        }
    });

    socket.on('drop', (roomId) => {
        const room = rooms[roomId];
        if (room && room.controllerId === socket.id && room.displayId) {
            io.to(room.displayId).emit('drop');
        }
    });

    // Event relay from Display to Controller (Game Over)
    socket.on('game_over', (roomId) => {
        const room = rooms[roomId];
        if (room && room.displayId === socket.id && room.controllerId) {
            io.to(room.controllerId).emit('game_over');
            // Auto-reset room state after game over
            room.status = 'AVAILABLE';
            room.controllerId = null;
        }
    });

    // Auto-Reset / Disconnect handling
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Find if the disconnected socket was a display or controller
        for (const [roomId, room] of Object.entries(rooms)) {
            if (room.controllerId === socket.id) {
                // Mobile client disconnected
                console.log(`Controller disconnected from room ${roomId}`);
                room.status = 'AVAILABLE';
                room.controllerId = null;
                if (room.displayId) {
                    io.to(room.displayId).emit('player_disconnected');
                }
            } else if (room.displayId === socket.id) {
                // Display disconnected
                console.log(`Display disconnected, removing room ${roomId}`);
                if (room.controllerId) {
                    io.to(room.controllerId).emit('access_denied', 'Display disconnected.');
                }
                delete rooms[roomId];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
