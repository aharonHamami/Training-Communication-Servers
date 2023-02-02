const express = require('express'); // for input
const app = express();

const cors = require('cors');

const { createProxyMiddleware } = require('http-proxy-middleware');

const port = 3005;

const httpRoutes = [
    {
        url: '/users',
        proxy: {
            target: "http://localhost:3006",
            changeOrigin: true, // if i understood right: http://localhost300 -> http://localhost3005
            pathRewrite: {
                [`^/users`]: ''
            }
        }
    },
    {
        url: '/editing',
        proxy: {
            target: "http://localhost:3008",
            changeOrigin: true,
            pathRewrite: {
                [`^/editing`]: ''
            }
        }
    }
];

const webSocketRoutes = [
    {
        // url: '/communication',
        proxy: {
            target: 'http://localhost:3007',
            changeOrigin: true, // if i understood right: http://localhost300 -> http://localhost3005
            ws: true, // support WebSocket / Socket.io
        }
    }
];

function start() {
    app.use(cors());
    
    app.get('/', (request, response) => {
        response.send(" -- Gateway server is working -- ");
    });
    
    // http proxy:
    httpRoutes.forEach(route => {
        app.use(route.url, createProxyMiddleware(route.proxy)); // proxy - send the message foreward
    });
    
    // socket.io proxy:
    webSocketRoutes.forEach(route => {
        app.use(createProxyMiddleware('/socket.io', route.proxy)); // proxy - send the message foreward
    });
    
    app.listen(port, () => {
        console.log(`listening in ${port}...`);
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
