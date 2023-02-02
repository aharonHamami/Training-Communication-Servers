const mongoose = require('mongoose');
const server = require('./src/Server/server.js');

// while(true) {
//     console.log('working...');
// }

mongoose.connect('mongodb://127.0.0.1:27017/Communication-Users')
    .then(() => {
        console.log("-- mongoose is connected --");
        server.start();
    })
    .catch(error => {
        console.log(`-- error: --\n ${error}`);
    });