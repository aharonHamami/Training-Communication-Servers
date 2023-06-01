const { parentPort } = require('worker_threads');
const { fft } = require('./fftTools');

parentPort.once('message', (signal) => {
    try {
        const result = fft(signal);
        parentPort.postMessage(result);
    }catch(e) {
        console.error('FFT Error: ', e);
        throw new Error('FFT Error');
    }
});