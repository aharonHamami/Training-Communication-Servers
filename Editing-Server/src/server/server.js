const express = require('express');
const fileupload = require('express-fileupload');

const app = express();

const port = 3008;

function saveFile(file) {
    console.log('we have a file: ', file.name);
            
    console.log('upload the file');
    file.mv(__dirname + '/../uploads/' + file.name, error => {
        if(error) {
            console.log("<< Error: couldn't store the file \"" + file.name + "\" >>");
        }
    });
}

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
    
    app.post('/upload-file', (request, response) => {
        if(!request.files) {
            console.log('<< Error: no file uploaded >>');
            // 400 - bad request
            response.status(400).json({message: 'No file uploaded'});
            return;
        }
        
        const data = [];
        
        if(!Array.isArray(request.files.audio)) {   // single file upload
            const audio = request.files.audio;
            
            saveFile(audio);
            
            data.push({
                name: audio.name,
                mimetype: audio.mimetype,
                size: audio.size
            });
        } else {                                    // multiple file uploads
            request.files.audio.forEach(audio => {
                saveFile(audio);
                
                data.push({
                    name: audio.name,
                    mimetype: audio.mimetype,
                    size: audio.size
                });
            });
        }
        
        response.status(200).json({
            message: 'Files uploaded successfully',
            data: data
        });
    });
    
    // app.get('/sounds', (request, response) => {
    //     response.sendFile
    // });
    
}

app.listen(port, () => {
    console.log(`listening on ${port}...`);
});

module.exports.start = start;