const express = require('express');
const app = express();

const cors = require('cors');

const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const { getRandomString } = require('../tools/tools');

const PORT = 3005;

let authenticated = []; // all the users that are connected -> {name, userId, token, expireDate}

function createAuth(userId, name, admin){
    // remove every similar authenticated info
    authenticated = authenticated.filter(auth => auth.userId !== userId);
    
    // creating a date for expiration:
    const expDate = new Date(); // expire date
    expDate.setTime(expDate.getTime() + 1 * 60 * 60 * 1000); // + 1 hour from now
    
    const authInfo = {
        userId: userId,
        name: name,
        admin: admin,
        token: getRandomString(20), // creating a new token
        expireDate: expDate
    };
    
    authenticated.push(authInfo);
    return authInfo;
};

function authenticate(token, checkAdmin) {
    const authIndex = authenticated.findIndex(auth => auth.token === token);
    let userAuth = authenticated[authIndex];
    
    console.log('all authentications: ', authenticated.map(auth => auth.token));
    console.log('auth: ', userAuth);
    
    if(!userAuth) {
        console.log('no available token found');
        return false;
    }
    
    const now = new Date().getTime();
    const expireDate = new Date(userAuth.expireDate).getTime();
    if(now >= expireDate) {
        console.log('date is expired');
        authenticated.splice(authIndex, 1); // remove the auth
        userAuth = null;
        return false;
    }
    
    if(checkAdmin && !userAuth.admin) {
        console.log("doesn't have administration access");
        return false;
    }
    
    return true;
}

const users_servise = process.env.USERS_SERVER || 'localhost';
const comm_servise = process.env.COMMUNICATION_SERVER || 'localhost';
const edit_service = process.env.EDITING_SERVER || 'localhost';

const httpRoutes = [
    {
        url: '/users',
        beforeProxy: (req, res, next) => {
            const whiteList = [
                /^[/]sign[-]up$/, // /sign-up
                /^[/]log[-]in$/ // /log-in
            ];
            // check white list
            const index = whiteList.findIndex(regExp => (regExp.test(req.url)));
            if(index != -1) { // found
                next();
                return;
            }
            
            const token = req.headers['authentication'];
            
            // the user need to be authenticated and has to have administration access
            if(!authenticate(token, true)) {
                console.log('blocking request');
                // 401 - Unauthorized
                res.status(401).json({ message: 'This information requires authentication' });
                // stop the request from passing
            }else {
                console.log('request authenticated');
                next();
            }
        },
        proxy: {
            target: `http://${users_servise}:3006`,
            changeOrigin: true, // if i understood correctly: http://localhost:3006 -> http://localhost3005
            pathRewrite: {
                [`^/users`]: ''
            },
            onProxyRes: (proxyRes, req, res) => {
                console.log('on proxy response');
                // proxyRes - response from the microserver
                // req - request sent from the client
                // res - response handler to the client
                
                const blackList = [
                    /^[/]sign[-]up$/, // /sign-up
                    /^[/]log[-]in$/ // /log-in
                ];
                // check white list
                const index = blackList.findIndex(regExp => (regExp.test(req.url)));
                if(index == -1) { // not found
                    return;
                }
                
                let responseData = null;
                let authData = null;
                
                proxyRes.on('data', data => {
                    // convert the data to json:
                    const bufferAsString = data.toString("utf-8");
                    
                    try {
                        responseData = JSON.parse(bufferAsString);
                        console.log('received data: ', responseData);
                        
                        if(responseData && responseData.name && responseData.userId) {
                            authData = createAuth(responseData.userId, responseData.name, responseData.admin);
                        }
                    }catch(e) {
                        responseData = bufferAsString;
                    }
                });
                
                // overriding res.write method to make my own response
                const write = res.write;
                res.write = (data) => {
                    if(authData) { // if authentication was made
                        try {
                            res.status(200).json({
                                message: 'you are logged in',
                                ...authData
                            });
                        }catch(error) {
                            console.log("Error: couldn't log in the user: ", error);
                        }
                    }
                    else { // if authentication wasn't maid - just foreward the response (like regular proxy)
                        write.call(res, JSON.stringify(responseData));
                    }
                }
            }
        }
    },
    {
        url: '/editing',
        beforeProxy: (req, res, next) => {
            console.log('editing request');
            // console.log('headers:', req.headers);
            const token = req.headers['authentication'];
            
            // the user need to be authenticated and has to have administration access
            if(!authenticate(token, true)) {
                console.log('blocking request');
                // 401 - Unauthorized
                res.status(401).json({ message: 'This information requires authentication' });
                // stop the request from passing
            }else {
                next();
            }
        },
        proxy: {
            target: `http://${edit_service}:3008`,
            changeOrigin: true,
            pathRewrite: {
                [`^/editing`]: ''
            },
        }
    }
];

const webSocketRoutes = [
    {
        // url: '/communication',
        proxy: {
            target: `http://${comm_servise}:3007`,
            changeOrigin: true, // if i understood correctly: http://localhost:3007 -> http://localhost3005
            ws: true, // support WebSocket / Socket.io
            onProxyReq: (proxyReq, req, res) => {
                console.log('http request');
                console.log('query: ', req.query);
            },
            onProxyReqWs: (proxyReq, req, socket, options, head) => {
                console.log('websocket request');   
                
                // get the queries from the request url:
                const urlSearchParams = new URLSearchParams(req.url.slice(req.url.indexOf('?')));
                const queries = Object.fromEntries(urlSearchParams.entries());
                
                console.log('token: ', queries.token);
                
                if(!authenticate(queries.token, false)) {
                    console.log('stop the request');
                    // stop the request from passing
                    proxyReq.abort();
                }
            }
        }
    }
];

function start() {
    app.use(cors());
    
    app.use((req, res, next) => {
        console.log('request: ' + req.path);
        next();
    })
    
    app.get('/', (request, response) => {
        response.send(" -- Gateway server is working -- ");
    });
    
    // // creating a middleware:
    // app.use((_, res) => {
    //     const send = res.send;
    //     res.send = function(body) {
    //         console.log('hello world');
    //         send.call(this, body);
    //     }
    // });
    
    // http proxy:
    httpRoutes.forEach(route => {
        if(route.beforeProxy) {
            app.use(route.url, route.beforeProxy);
        }
        app.use(route.url, createProxyMiddleware(route.proxy)); // proxy - send the message foreward
    });
    
    // socket.io proxy:
    webSocketRoutes.forEach(route => {
        app.use(createProxyMiddleware('/socket.io', route.proxy)); // proxy - send the message foreward
    });
    
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({message: 'Proxy: something went wrong'});
    });
    
    app.listen(PORT, () => {
        console.log(`listening in ${PORT}...`);
    });
}

module.exports.start = start;
