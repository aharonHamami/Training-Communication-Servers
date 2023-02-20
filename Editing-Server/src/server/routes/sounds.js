const express = require('express');
const fs = require('fs');
const path = require('path');

const SOUNDS_DIR = path.join(__dirname, '..', '..', 'audio', 'sounds');

const router = express.Router();

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

module.exports = router;