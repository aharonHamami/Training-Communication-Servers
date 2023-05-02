const express = require('express');
const path = require('node:path');
const { Worker } = require('node:worker_threads');
const { dft, fft, ifft, idft, spectralSubtraction } = require('../../tools/fftTools');

const router = express.Router();

router.post('/calculateDFT', (request, response) => {
    console.log('start calculating DFT...');
    try {
        const calculatedDFT = dft(Object.values(request.body.signal));
        console.log('DFT ready: ', calculatedDFT);
        response.status(200).json({
            message: 'DFT of the signal',
            DFT: calculatedDFT
        });
    }catch (e) {
        console.log("Error: couldn't calculate DFT: ", e);
        response.status(500).json({
            message: "something went wrong, couldn't handle the request"
        });
    }
});

router.post('/calculateFFT', (request, response) => {
    console.log('start calculating FFT...');
    try {
        let signal = request.body.signal;
        if(!Array.isArray(signal)) {
            signal = Object.values(signal);
        }
        
        const fftResult = fft(signal);
        
        console.log('FFT ready: ', fftResult);
        response.status(200).json({
            message: 'FFT of the signal',
            FFT: fftResult
        });
    }catch (e) {
        console.log("Error: couldn't calculate FFT: ", e);
        response.status(500).json({
            message: "something went wrong, couldn't handle the request"
        });
    }
});

router.post('/calculateIDFT', (request, response) => {
    console.log('start calculating IDFT...');
    try {
        let frequencies = request.body.frequencies;
        if(!Array.isArray(frequencies)) {
            frequencies = Object.values(frequencies);
        }
        
        const idftResult = idft(frequencies);
        
        console.log('IDFT ready: ', idftResult);
        response.status(200).json({
            message: 'Inverse DFT',
            IDFT: idftResult
        });
    }catch (e) {
        console.log("Error: couldn't calculate IDFT: ", e);
        response.status(500).json({
            message: "something went wrong, couldn't handle the request"
        });
    }
});

router.post('/calculateIFFT', (request, response) => {
    console.log('start calculating IFFT...');
    try {
        let frequencies = request.body.frequencies;
        if(!Array.isArray(frequencies)) {
            frequencies = Object.values(frequencies);
        }
        
        const ifftResult = ifft(frequencies);
        
        console.log('IFFT ready: ', ifftResult);
        response.status(200).json({
            message: 'Inverse FFT',
            IDFT: ifftResult
        });
    }catch (e) {
        console.log("Error: couldn't calculate IFFT: ", e);
        response.status(500).json({
            message: "something went wrong, couldn't handle the request"
        });
    }
});

router.post('/removeNoise', (request, response) => {
    try {
        const worker = new Worker(path.join(__dirname, '..', '..', 'tools', 'spectralSubtraction_service.js')); // to run spectral subtraction in parallel
        
        const {speachDomain, noiseDomain} = request.body;
        let signal = request.body.signal;
        
        if(!Array.isArray(signal)) {
            signal = Object.values(signal);
        }
        
        console.log('-----v------v-------v-----');
        const speachSignal = signal.slice(speachDomain.start, speachDomain.start + speachDomain.size);
        const noiseSignal = signal.slice(noiseDomain.start, noiseDomain.start + noiseDomain.size);
        worker.postMessage([speachSignal, noiseSignal]);
        worker.once('message', (result) => {
            const clearSpeach = result;
            console.log('-----^------^-------^-----');
            
            // for some reason 'Array.splice()' not working here. "Maximum call stack size" error.
            const responseSignal = [...signal.slice(0, speachDomain.start), ...clearSpeach, ...signal.slice(speachDomain.start + speachDomain.size)];
            
            response.status(200).json({
                message: 'clear signal',
                signal: responseSignal
            });
        });
        worker.on('error', error => {
            response.status(500).json({message: 'Could not calculate Spectral Subtraction, try again later'});
            console.error(error);
        });
    }catch(e) {
        response.status(500).json({message: 'Something went wrong, try again later'});
        console.error(error);
    }
});

module.exports = router;