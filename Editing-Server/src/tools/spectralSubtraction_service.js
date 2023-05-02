const { parentPort } = require('worker_threads');
const { spectralSubtraction } = require('./fftTools');

parentPort.once('message', (data) => {
    try {
        const result = spectralSubtraction(...data);
        parentPort.postMessage(result);
    }catch(e) {
        console.error('Spectral Subtraction Error: ', e);
        throw new Error('Spectral Subtraction Error');
    }
});