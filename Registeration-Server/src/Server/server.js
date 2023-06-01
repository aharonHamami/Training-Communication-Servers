const express = require('express');
const app = express();

const cors = require('cors');

const UsersDB = require('../DataBase/Schemas/Users.js');
// const AuthDB = require('../DataBase/Schemas/Authenticated');
const { getRandomString } = require('../tools/tools.js');

const PORT = 3006;

function signUp(request, response) {
    console.log("[post /sign-up] -> request.body = ", request.body);
    
    UsersDB.findOne({email: request.body.email}).exec() // exec gives a more 'accurate' error stack
        .then(existingUser => {
            console.log("existing user: ", existingUser);
            // if(existingUser !== null){
            //     // 409 - conflict error
            //     response.status(409).json({message: 'This email is already used'}); // error
            //     return;
            // }
            
            const user = new UsersDB(request.body);
            // UsersDB.create(request.body)
            user.save()
                .then(() => {
                    console.log('- user created -');
                    
                    // 200 - Success
                    response.status(200).json({
                        message: 'you signed up successfully',
                        userId: user.publicId,
                        name: request.body.name,
                        admin: user.admin
                    });
                })
                .catch(error => {
                    let errorMessage = "Error: couldn't make a user";
                    
                    console.log("Error: couldn't add user to the database.\n", {
                        errorMessage: error.message,
                        errorName: error.name,
                    });
                    if (error.name === "ValidationError") {
                        console.log('error value: ', Object.values(error.errors)[0].message);
                        errorMessage = Object.values(error.errors)[0].message;
                    }else if(error.code === 11000) { // unique key used twice
                        if(error.keyPattern) {
                            const key = Object.keys(error.keyPattern)[0];
                            console.log('error value: ', key);
                            errorMessage = `this ${key} is already in use`;
                        }
                    }
                    
                    // 400 - bad request
                    response.status(400).json({
                        message: errorMessage
                    });
                });
        })
        .catch(error => {
            console.log("error while trying to find a user\n", error);
            
            // 500 - server error
            response.status(500).json({
                message: "error: couldn't make a user"
            });
        });
}

function logIn(request, response) {
    console.log("[post /log-in] -> request.body = ", request.body);
    
    UsersDB.schema.path('email').doValidate(request.body.email, error => {
        if(error !== null) {
            response.status(400).json({
                message: 'Invalid email address'
            });
            return;
        }
        
        UsersDB.findOne({email: request.body.email}).exec()
            .then(user => { 
                console.log("existing user: ", user);
                if(user == null){
                    console.log(' - couldn\'t find the user - ');
                    // 409 - conflict error
                    response.status(409).json({message: "This user doesn't exist"}); // error
                    return;
                }
                else if(user.password !== request.body.password){
                    console.log("password is incorrect");
                    // 403 - Forbidden
                    response.status(403).json({message: 'your email or password is incorrect'}); // error
                } else {
                    console.log(` - user ${user.email} logged in - `);
                    
                    // 200 - Success
                    response.status(200).json({
                        message: 'you logged in successfully',
                        userId: user.publicId,
                        name: user.name,
                        admin: user.admin
                    });
                }
                
            })
            .catch(error => {
                console.log("error while trying to find a user\n", error);
                
                // 500 - server error
                response.status(500).json({
                    message: "error: couldn't log the user in"
                });
            });
    });
}

function start(){
    // app.use(cors({origin: "http://localhost:3009"}));
    app.use(express.json());
    
    app.use((req, res, next) => {
        console.log('request: ' + req.path);
        next();
    });
    
    app.get('/', (request, response) => {
        response.send(' -- Registeration server is working -- ');
    });
    
    app.post('/sign-up', signUp);
    app.post('/log-in', logIn);
    
    app.get('/users-info', async (request, response) => {
        try {
            const users = await UsersDB.find({}, {_id: 0, __v: 0});
            response.status(200).json({ users: users });
        }catch(error) {
            response.status(500).json({message: 'Something went wrong, try again later'});
            console.error(error);
        }
    });
    
    app.post('/update-user/:id', (request, response) => {
        try {
            const userId = request.params.id;
            const { name, password, admin } = request.body;
            console.log('update: ', request.body);
            
            // update the user info:   
            UsersDB.findOneAndUpdate({publicId: userId}, {$set: {name, password, admin}}, {runValidators: true, returnOriginal: false})
                .then(deletedUser => {
                    let { _id, __v, ...userInfo } = deletedUser._doc;
                    response.status(200).json({
                        message: `User ${userId} updated successfully`,
                        user: userInfo
                    });
                })
                .catch(error => {
                    let errorMessage = "Error: couldn't update a user";
                        
                    console.log("Error: couldn't update a user on the database.\n", error.message);
                    if (error.name === "ValidationError") {
                        console.log('error value: ', Object.values(error.errors)[0].message);
                        errorMessage = Object.values(error.errors)[0].message;
                    }
                    
                    // 400 - bad request
                    response.status(400).json({
                        message: errorMessage
                    });
                });
        }catch(error) {
            response.status(500).json({message: 'Something went wrong, try again later'});
            console.error(error);
        }
    });
    
    app.delete('/:id', (request, response) => {
        const userId = request.params.id;
        
        UsersDB.deleteOne({publicId: userId})
            .then(() => {
                response.status(200).json({message: 'user deleted successfully'});
            })
            .catch(error => {
                response.status(500).json({message: "Couldn't delete the user"});
            });
    });
    
    app.all('*', (req, res) => {
        console.log('bad request:', req.url);
        res.status(400).send({message: 'No such route available'});
    });
    
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({message: 'Registeration: something went wrong'});
    });
    
    app.listen(PORT, () =>{
        console.log(`listening on ${PORT}...`);
    });
}

module.exports.start = start;