const express = require('express');
const app = express();

const UsersDB = require('../DataBase/Schemas/Users.js');
// const AuthDB = require('../DataBase/Schemas/Authenticated');
const { getRandomString } = require('../tools/tools.js');

const port = 3006;

let authenticated = []; // all the users that are connected -> {email, userId, token, expireDate}

function createAuth(email){
    // remove all the similar authenticated info
    authenticated = authenticated.filter(auth => auth.email !== email);
    
    const auth = {email: email, token: getRandomString(20)};
    
    let userId, sameAuth = undefined;
    do {
        userId = 'user_'+getRandomString(5);
        // sameAuth = AuthDB.findOne({userId: userId});
        sameAuth = authenticated.find(auth => {
            return auth.userId === userId;
        });
    }while(sameAuth !== undefined);
    auth.userId = userId;
    
    const expDate = new Date(); // expire date
    expDate.setTime(expDate.getTime() + 1 * 60 * 60 * 1000); // + 1 hour
    auth.expireDate = expDate;
    
    authenticated.push(auth);
    return auth;
};

function signUp(request, response) {
    console.log("[post /sign-up] -> request.body = ", request.body);
    
    UsersDB.findOne({email: request.body.email})
        .then(existingUser => {
            console.log("existing user: ", existingUser);
            if(existingUser !== null){
                // 409 - conflict error
                response.status(409).json({message: 'This email is already used'}); // error
                return;
            }
            
            const user = new UsersDB(request.body);
            // UsersDB.create(request.body)
            user.save()
                .then(() => {
                    console.log('- user created -');
                    
                    const auth = createAuth(request.body.email);
                    
                    // 200 - Success
                    response.status(200).json({
                        message: 'you signed up successfully',
                        userId: auth.userId,
                        token: auth.token
                    });
                })
                .catch(error => {
                    let errorMessage = "Error: couldn't make a user";
                    
                    console.log("Error: couldn't add user to the database.\n", error.message);
                    if (error.name === "ValidationError") {
                        // Object.keys(error.errors).forEach((key) => {
                        //     console.log(key, ' -> ', error.errors[key].message);
                        // });
                        console.log('error value: ', Object.values(error.errors)[0].message);
                        errorMessage = Object.values(error.errors)[0].message;
                    }
                    
                    // 400 - bad request
                    response.status(400).json({
                        message: errorMessage
                    });
                });
        })
        .catch(error => {
            console.log("error while trying to find a user\n", error);
            
            // 500 - internet server error
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
        
        UsersDB.findOne({email: request.body.email})
            .then(user => { 
                console.log("existing user: ", user);
                if(user == null){
                    console.log(' - couldn\'t find the user - ');
                    // 409 - conflict error
                    response.status(409).json({message: "couldn't find the user"}); // error
                    return;
                }
                else if(user.password !== request.body.password){
                    console.log("password is incorrect");
                    // 403 - Forbidden
                    response.status(403).json({message: 'your email or password is incorrect'}); // error
                } else {
                    console.log(` - user ${user.email} logged in - `);
                    
                    const auth = createAuth(request.body.email);
                    
                    // 200 - Success
                    response.status(200).json({
                        message: 'you logged in successfully',
                        name: user.name,
                        userId: auth.userId,
                        token: auth.token
                    });
                }
                
            })
            .catch(error => {
                console.log("error while trying to find a user\n", error);
                
                // 500 - internet server error
                response.status(500).json({
                    message: "error: couldn't log the user in"
                });
            });
    });
}

function start(){
    app.use(express.json());
    
    app.use((req, res, next) => {
        console.log('request: ' + req.path);
        next();
    })
    
    app.get('/', (request, response) => {
        response.send(' -- Registeration server is working -- ');
    });
    
    app.post('/sign-up', signUp);
    app.post('/log-in', logIn);
    
    app.all('*', (req, res) => {
        console.log('bad request:', req.url);
        res.status(400).send({message: 'No such route available'});
    })
    
    app.listen(port, () =>{
        console.log(`listening on ${port}...`);
    });
}

module.exports.start = start;