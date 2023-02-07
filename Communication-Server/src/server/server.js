// initialling express
const express = require('express');
const app = express();

// initialling socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3005",
    }
});

const PORT = 3007;

function start() {
    app.use(express.json());
    
    app.use('/', (request, response) => {
        response.send(' -- Communication server is working -- ');
    });
    
    io.use((socket, next) => {
        // check if the user is authenticated:
        const auth = socket.handshake.auth;
        // console.log('user id: ', auth.userId);
        // console.log('room id: ', auth.roomId);
        if(typeof auth.userId == 'string' && typeof auth.roomId == 'string'){
            socket.user = {};
            
            socket.user.name = auth.userName;
            socket.user.id = auth.userId;
            socket.user.roomId = auth.roomId;
            
            next();
        }
    });
    
    const usersArray = []; // [{name: 'name', id: 111, roomId: 222}]
    const socketMap = []; // [{userId: 'userId', socketId: 'socketId'}]
    
    // socket.io listen to connections
    io.on('connection', socket => {
        const user = socket.user;
        
        console.log('+ user connected:', {name: user.name, id: user.id});
        socket.emit('welcome', usersArray);
        
        usersArray.push(user);
        socketMap.push({userId: user.id, socketId: socket.id});
        console.log('all connected useers:', usersArray.map(u => u.id));
        
        // start to build the signaling server
        socket.join(user.roomId);
        socket.broadcast.emit('user-joined', user.id, user.name);
        
        socket.on('send-message', (otherUserId, message) => {
            console.log(`${user.id} sended a mesassage to ${otherUserId}: ${message.type}`);
            
            const otherSocketId = socketMap.find(element => element.userId === otherUserId).socketId;
            
            if(otherSocketId) {
                // console.log(`send the message (socket id is ${otherSocketId})`);
                socket.to(otherSocketId).emit('message-from-peer', user.id, message); // forwarding the message
            }
        });
        
        socket.on('disconnect', () => {
            console.log('- user disconnected: ', {name: user.name, id: user.id});
            socket.broadcast.emit('user-left', user.id);
            
            const userIndex = usersArray.findIndex(currentUser => (currentUser.id === user.id));
            if(userIndex !== -1) {
                const deletedUsers = usersArray.splice(userIndex, 1);
                // console.log('deleted users: ', deletedUsers);
            }else {
                console.log('<< Error: user not found >>', new Error().lineNumber);
            }
            
            const socketIndex = socketMap.findIndex(currentSocket => (currentSocket.userId === user.id));
            if(socketIndex !== -1) {
                const deletedSockets = socketMap.splice(socketIndex, 1);
                // console.log('deleted sockets: ', deletedSockets);
            }else {
                console.log('<< Error: socekt not found >>', new Error().lineNumber);
            }
            
            console.log('reminded users:', usersArray.map(u => u.id));
        });
    });
    
    server.listen(port, () => {
        console.log(`listening on ${port}...`);
    });
}

module.exports.start = start;