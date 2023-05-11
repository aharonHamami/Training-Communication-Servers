const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'audio', 'uploads');

// using GridFS in mongoodb - for file system management and uploading files to MongoDB
let bucket;
mongoose.connection.on('connected', () => {
    console.log('connect to records bucket');
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {bucketName: 'recordsFS'});
});

function saveFile(file) {
    console.log('we have a file: ', file.name);
    
    // checking file type
    const extensionName = path.extname(file.name);
    console.log('extension name: ', extensionName);
    const allowedExtension = ['.mp3','.ogg','.wav'];
    if(!allowedExtension.includes(extensionName)){
        throw new Error('invalid file extension');
    }
    
    console.log('upload the file');
    file.mv(UPLOADS_DIR + '/' + file.name, error => {
        if(error) {
            console.log("<< Error: couldn't store the file \"" + file.name + "\" >>");
            throw new Error("couldn't store file " + file.name);
        }
        
        // upload the file to MongoDB
        fs.createReadStream(path.join(UPLOADS_DIR, file.name)).pipe(
            bucket.openUploadStream(file.name)
        );
    });
}

// response: records list
router.get('/', (request, response) => {
    console.log('records list request');
    
    // MongoDb file system
    bucket.find({}, {_id: 0, filename: 1}).toArray()
        .then(documents => {
            const names = documents.map(doc => doc.filename);
            response.status(200).json({recordNames: names});
        })
        .catch(error => {
            // 500 - Internal Server Error
            response.status(500).json({message: 'Could not handle your request'});
            console.log("Error: \n", error);
        });
    
    // from local file system:
    // fs.readdir(UPLOADS_DIR, (error, files) => {
    //     if(error) {
    //         response.status(500).json({message: 'Error: Could not handle your request'});
    //         return;
    //     }
    //     // const audioFiles = files.filter(file => file.endsWith('.mp3'));
    //     response.status(200).json({recordNames: files});
    // });
});

router.get('/:name', (request, response) => {
    console.log('specific record request');
    
    const fileName = request.params.name;
    
    console.log('record requested: ', fileName);
    
    // from local file system:
    // const options = {
    //     root: path.join(UPLOADS_DIR)
    // };
    // response.sendFile(fileName, options, (error) => {
    //     if(error) {
    //         console.log("\nCouldn't send the file, Error:\n", error, '\n');
    //     }else {
    //         console.log("file sent successfully");
    //     }
    // });
    
    // from MongoDB:
    // response.setHeader('Content-Length', file.size);
    // response.setHeader('Content-Type', 'audio/mpeg');
    // response.setHeader('Content-Disposition', 'attachment; filename=your_file_name');
    bucket.openDownloadStreamByName(fileName).pipe(response);
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
        
        try{
            saveFile(audio);
            
            data.push({
                name: audio.name,
                mimetype: audio.mimetype,
                size: audio.size
            });
        }catch(error) {
            console.log('Error: did not manage to save ' + audio.name, error);
        }
    } else {                                    // multiple file uploads
        request.files.audio.forEach(audio => {
            try {
                saveFile(audio);
                
                data.push({
                    name: audio.name,
                    mimetype: audio.mimetype,
                    size: audio.size
                });    
            }catch (error) {
                console.log('Error: did not manage to save ' + audio.name, error);
            }
        });
    }
    
    if(data.length > 0) {
        response.status(200).json({
            message: 'Files uploaded successfully',
            files: data
        });
    }else {
        // 400 - Bad Request
        response.status(400).json({
            message: 'Could not save your files, check your files settings'
        });
    }
});

router.delete('/:name', async (request, response) => {
    try {
        const fileName = request.params.name;
        
        // prevent cases when the user send a path that contain '..'
        if(fileName.split('.').length > 2) {
            console.error(`<< Warning: user sent an invalid record name ${fileName} >>`);
            // 400 - Bad Request
            response.status(400).json({ message: 'Invalid file name' });
            return;
        }
        
        console.log('delete record requested: ', fileName);
        
        // delete from MongoDB:
        bucket.find({filename: fileName}, {_id: 1,}).toArray()
        .then(documents => {
                console.log('documents: ', documents);
                
                const doc = documents[0];
                
                bucket.delete(doc._id, (error) => {
                    if(error) {
                        response.status(500).json({ message: "Couldn't handle your request" });
                    }
                });
                
                response.status(200).json({ message: `Record ${fileName} was deleted successfully` });
            })
            .catch(error => {
                console.error(`couldn't find record ${fileName}\n`, error); 
                // 400 - Bad Request
                response.status(400).json({
                    message: 'Could not find the record you want to delete'
                });
            });
        
        // delete from the file system:
        fs.unlink(path.join(UPLOADS_DIR, fileName), (error) => {
            if (error) throw error;
            
            console.log(`Record ${fileName} deleted from file system successfully`);
        });
        
    }catch(err) {
        response.status(500).json({message: 'Something went wrong, try again later'});
        console.error(err);
    }
});

module.exports = router;