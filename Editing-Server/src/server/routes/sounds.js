const express = require('express');
const fs = require('fs');
const path = require('path');

const SOUNDS_DIR = path.join(__dirname, '..', '..', 'audio', 'sounds');

const router = express.Router();

function saveFile(file) {
    console.log('we have a file: ', file.name);
            
    console.log('upload the file');
    file.mv(SOUNDS_DIR + '/' + file.name, error => {
        if(error) {
            console.log("<< Error: couldn't store the file \"" + file.name + "\" >>");
        }
    });
}

// response: sound list
router.get('/', (request, response) => {
    console.log('sound list request');
    
    fs.readdir(SOUNDS_DIR, (error, files) => {
        if(error) {
            response.status(500).json({message: 'Error: Could not handle your request'});
            return;
        }
        
        // const audioFiles = files.filter(file => file.endsWith('.mp3'));
        
        response.status(200).json({soundNames: files});
    });
});

// response: the sound specified
router.get('/:name', (request, response) => {
    console.log('specific sound request');
    
    const fileName = request.params.name;
    
    console.log('sound requested: ', fileName);
    
    const options = {
        root: path.join(SOUNDS_DIR)
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
router.post('/upload-files', (request, response) => {
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