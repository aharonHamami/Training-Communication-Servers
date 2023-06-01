const { parentPort } = require('worker_threads');
const { ifft } = require('./fftTools');

parentPort.once('message', (frequencies) => {
    try {
        const result = ifft(frequencies);
        parentPort.postMessage(result);
    }catch(e) {
        console.error('Inverse FFT Error: ', e);
        throw new Error('Inverse FFT Error');
    }
});