const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'audio', 'uploads');

function saveFile(file) {
    console.log('we have a file: ', file.name);
            
    console.log('upload the file');
    file.mv(UPLOADS_DIR + '/' + file.name, error => {
        if(error) {
            console.log("<< Error: couldn't store the file \"" + file.name + "\" >>");
        }
    });
}

// response: records list
router.get('/', (request, response) => {
    console.log('records list request');
    
    fs.readdir(UPLOADS_DIR, (error, files) => {
        if(error) {
            response.status(500).json({message: 'Error: Could not handle your request'});
            return;
        }
        
        // const audioFiles = files.filter(file => file.endsWith('.mp3'));
        
        response.status(200).json({recordNames: files});
    });
});

router.get('/:name', (request, response) => {
    console.log('specific record request');
    
    const fileName = request.params.name;
    
    console.log('record requested: ', fileName);
    
    const options = {
        root: path.join(UPLOADS_DIR)
    };
    
    response.sendFile(fileName, options, (error) => {
        if(error) {
            console.log("\nCouldn't send the file, Error:\n", error, '\n');
        }else {
            console.log("file sent successfully");
        }
    });
});

// response: the record specified
router.post('/upload-file', (request, response) => {
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
        files: data
    });
});

module.exports = router;