// const { response } = require('express');
const mongoose = require('mongoose');
const server = require('./src/Server/server.js');

// default port - localhost
const db_url = process.env.MONGODB_SERVER || '127.0.0.1:27017'; // for docker containers - we need to have the MongoDB container name

mongoose.connect(`mongodb://${db_url}/Communication-Users`)
    .then(() => {
        console.log("-- mongoose is connected --");
        server.start();
    })
    .catch(error => {
        console.log(`-- error: --\n ${error}`);
    });

// const bucket = new mongoose.mongo.GridFSBucket(model.db);