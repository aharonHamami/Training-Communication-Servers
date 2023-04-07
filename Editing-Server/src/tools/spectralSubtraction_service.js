const { parentPort } = require('worker_threads');
const { spectralSubtraction } = require('./fftTools');

parentPort.once('message', (data) => {
    const result = spectralSubtraction(...data);
    parentPort.postMessage(result);
});