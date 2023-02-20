const express = require('express');
const fileupload = require('express-fileupload');

const soundsRouter = require('./routes/sounds');
const recordsRouter = require('./routes/records');

const app = express();

const PORT = 3008;

function start() {
    
    // parse FormData files into an object.
    // This middleware will enable the server to get 'multipart/form-data' requests.
    app.use(fileupload({
        createParentPath: true, // when using mv() it can create a new folder if not exist yet
    }));
    
    app.use(express.json());
    
    app.get('/', (request, response) => {
        response.send(' -- Editing server is working -- ');
    });
    
    // for records:
    app.use('/records', recordsRouter);
    
    // for noise sounds:
    app.use('/sounds', soundsRouter);
    
}

app.listen(PORT, () => {
    console.log(`listening on ${PORT}...`);
});

module.exports.start = start;