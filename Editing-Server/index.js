const mongoose = require('mongoose');
const server = require('./src/server/server.js');

mongoose.connect('mongodb://127.0.0.1:27017/Communication-Recordings')
    .then(() => {
        console.log('mongodb connected');
        server.start();
    })
    .catch(error => {
        console.log(`-- error: --\n ${error}`);
    });