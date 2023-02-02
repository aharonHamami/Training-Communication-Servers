const express = require('express');
const fileupload = require('express-fileupload');

const app = express();

const port = 3008;

function start() {
    
    app.get('/', (request, response) => {
        response.send(' -- Editing server is working -- ');
    });
    
    // This middleware will enable the server to get 'multipart/form-data' requests.
    // parse FormData files into an object
    app.use(fileupload({
        createParentPath: true
    }));
    
    app.use(express.json());
    
    app.post('/upload-file-test', (request, response) => {
        response.status(200).json({message: '(test) file uploaded successfully'});
    })
    
    app.post('/upload-file', (request, response) => {
        if(!request.files) {
            console.log('<< Error: no file uploaded >>');
            // 400 - bad request
            response.status(400).json({message: 'No file uploaded'});
            return;
        }
        console.log('file uploaded', request.files);
        
        // let avatar = request.files.avatar; // is it realy avatar? need to check
        
        // // save the file
        // avatar.mv('../uploads/' + avatar.name);
        
        response.status(200).json({
            // data about the files that have been uploaded
            // data: {
            //     name: avatar.name,
            //     mimetype: avatar.mimetype,
            //     size: avatar.size
            // },
            message: 'File uploaded successfully'
        });
    });
    
}

app.listen(port, () => {
    console.log(`listening on ${port}...`);
});

module.exports.start = start;