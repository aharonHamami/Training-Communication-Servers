const express = require('express'); // for input
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

const httpRoutes = [
    {
        url: '/users',
        proxy: {
            target: "http://localhost:3006",
            changeOrigin: true, // if i understood correctly: http://localhost:3006 -> http://localhost3005
            pathRewrite: {
                [`^/users`]: ''
            },
            onProxyRes: (proxyRes, req, res) => {
                console.log('on proxy response');
                // proxyRes - response from the microserver
                // req - request sent from the client
                // res - response handler to the client
                
                let responseData = null;
                let authData = null;
                
                proxyRes.on('data', data => {
                    // convert the data to json:
                    const bufferAsString = data.toString("utf-8");
                    responseData = JSON.parse(bufferAsString);
                    console.log('received data: ', responseData);
                    
                    if(responseData.name && responseData.userId) {
                        authData = createAuth(responseData.userId, responseData.name, responseData.admin);
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
            
            const userAuth = authenticated.find(auth => auth.token === token);
            console.log('auth: ', userAuth);
            
            // the user need to be authenticated and has to have administration access
            if(!userAuth || !userAuth.admin) {
                console.log('blocking request');
                // 401 - Unauthorized
                res.status(401).json({ message: 'This information requires authentication' });
                // stop the request from passing
            }else {
                next();
            }
        },
        proxy: {
            target: "http://localhost:3008",
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
            target: 'http://localhost:3007',
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
                
                
                // check the token on the list and abort it there is no authentication
                console.log('all authentications: ', authenticated.map(auth => auth.token));
                const userAuth = authenticated.find(auth => auth.token === queries.token);
                // console.log('auth: ', userAuth);
                if(!userAuth) {
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
    
    app.listen(PORT, () => {
        console.log(`listening in ${PORT}...`);
    });
}

module.exports.start = start;


// for testing:

/*app.all(route.url+'*', (req, res) => {
            console.log(`send to: ${route.proxy.target}${req.originalUrl.replace(route.url,'')}/${req.params}`);
            // try {
                console.log('trying to send...');
                axios.request({
                    method: req.method,
                    url: `${route.proxy.target}${req.originalUrl.replace(route.url,'')}/${req.params.id}`,
                    data: req.body,
                    headers: req.headers
                }).then(response => {
                    console.log('success');
                    res.json(response.data);
                }).catch(error => {
                    console.log('Error:\n', error.message);
                    res.status(500).json({
                        message: 'Error: something went wrong while forwarding the message'
                    });
                });
        });*/
