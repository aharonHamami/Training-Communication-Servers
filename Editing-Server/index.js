const mongoose = require('mongoose');
const server = require('./src/server/server.js');

// default port - localhost
const db_service = process.env.MONGODB_SERVER || '127.0.0.1:27017'; // for docker containers - we need to have the MongoDB container name

mongoose.connect(`mongodb://${db_service}/Communication-Recordings`)
    .then(() => {
        console.log('mongodb connected');
        server.start();
    })
    .catch(error => {
        console.log(`-- error: --\n ${error}`);
    });