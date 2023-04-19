// initialling express
const express = require('express');
const app = express();

// initialling socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3005", // API Gateway Address
    }
});

const PORT = 3007;

function start() {
    app.use(express.json());
    
    app.use('/', (request, response) => {
        response.send(' -- Communication server is working -- ');
    });
    
    io.use((socket, next) => {
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
    
    // socket.io listen to connections
    io.on('connection', async socket => {
        const user = socket.user;
        
        console.log('+ user connected:', {name: user.name, id: user.id});
        // console.log('socket id: ', socket.id);
        socket.emit('welcome', usersArray);
        
        usersArray.push(user);
        console.log('all connected useers:', usersArray.map(u => u.id));
        
        // start to build the signaling server
        socket.join(user.roomId);
        socket.broadcast.emit('user-joined', user.id, user.name);
        
        socket.on('send-message', async (recipientId, message) => {
            console.log(`${user.id} sent a mesassage to ${recipientId}: ${message.type}`);
            
            // find the right socket:
            const sockets = await io.in(user.roomId).fetchSockets();
            const recipientSocket = sockets.find(s => s.user.id === recipientId);
            if(recipientSocket) {
                console.log('send');
                // send the message:
                socket.to(recipientSocket.id).emit('message-from-peer', user.id, message);
            }
        });
        
        socket.on('disconnect', () => {
            console.log('- user disconnected: ', {name: user.name, id: socket.id});
            socket.broadcast.emit('user-left', user.id);
            
            const userIndex = usersArray.findIndex(currentUser => (currentUser.id === user.id));
            if(userIndex !== -1) {
                const deletedUsers = usersArray.splice(userIndex, 1);
                // console.log('deleted users: ', deletedUsers);
            }else {
                console.log('<< Error: user not found >>', new Error().lineNumber);
            }
            
            console.log('reminded users:', usersArray.map(u => u.id));
        });
    });
    
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({message: 'Communication: something went wrong'});
    });
    
    server.listen(PORT, () => {
        console.log(`listening on ${PORT}...`);
    });
}

module.exports.start = start;