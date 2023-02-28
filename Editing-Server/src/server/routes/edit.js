const express = require('express');
const { create, all, help } = require('mathjs');

const config = { }
const math = create(all, config)

const router = express.Router();

function multiply(...args) {
    // console.log('multiply:');
    let m = 1;
    for(const arg of args) {
        // console.log(m);
        m = math.multiply(m, arg);
    }
    return m;
}

// signal should be an array of numbers between -1 and 1.
const dft = (signal) => {
    // console.log('start calculating DFT');
    const X = []; // dft per frequency
    const N = signal.length;
    
    // calculate the center of mass for each frequency (k)
    for(let k=0; k<N; k++) {
        // console.log('loop '+k+'/'+N);
        
        let Xk = math.complex(0,0);
        for(const n in signal) {
            // e^(-i2πkn/N)
            const primitiveRoot = math.pow(math.e, multiply(math.i, -2, math.pi, k, math.divide(n, N)));
            // x(n)
            const amptitude = signal[n];
            // x(n) * e^(-i2πkn/N)
            const cmplxNum = math.multiply(amptitude, primitiveRoot);
            
            Xk = math.add(Xk, cmplxNum);
        }
        
        // console.log('Xk = ', Xk);
        X.push(Xk);
    }
    
    return X;
};

// this function assumes that the the signal's length is a power of 2
const fft = (signal) => {
    const N = signal.length;
    const halfN = Math.floor(N / 2);
    
    const X = [];
    // X.length = N;
    
    // stop condition:
    if(N == 1) {
        return [signal[0]]; // an fft of 1 element is the same element
    }
    
    // splitting the signal to even and odd numbers
    const evenSignal = [];
    const oddSignal = [];
    for(let m=0; m<halfN; m++) {
        evenSignal.push(signal[m*2]);
        oddSignal.push(signal[m*2+1]);
    }
    
    // E (fft list for each k)
    const evenFFT = fft(evenSignal);
    // O (fft list for each k)
    const oddFFT = fft(oddSignal);
    
    // We will calculate half of the fft by using the fft i calculated of even and odd indexes
    // I can calculate the rest half of the fft by using the first half of the fft
    for(let k=0; k<halfN; k++) {
        // Wk = e^(-i2πkn/N)
        const primitiveRoot = math.pow(math.e, math.divide(multiply(math.i, -2, math.pi, k), N));
        
        // Ek + Wk*Ok ; k < N/2
        X[k] = math.add(evenFFT[k], math.multiply(primitiveRoot, oddFFT[k]));
        // Ek - Wk*Ok ; k >= N/2
        X[halfN + k] = math.subtract(evenFFT[k], math.multiply(primitiveRoot, oddFFT[k]));
    }
    
    // // fix for cases when N is not a power of 2:
    // if(halfN*2 !== N) {
    //     // add the last element of the sum of DFT: x[N-1]*e^(-2iπ(N-1)k/N) for each frequency
    //     for(const k in signal) {
    //         X[k] = 
    //     }
    // }
    
    return X;
}

router.post('/makeDFT', (request, response) => {
    console.log('start calculating DFT...');
    try {
        const calculatedDFT = dft(Object.values(request.body.waveform));
        console.log('DFT ready: ', calculatedDFT);
        response.status(200).json({
            message: 'DFT of the signal',
            DFT: calculatedDFT
        });
    }catch (e) {
        console.log("Error: couldn't calculate DFT: ", e);
        response.status(500).json({
            message: 'something went wrong on our side'
        });
    }
});

router.post('/makeFFT', (request, response) => {
    console.log('start calculating FFT...');
    try {
        const calculatedFFT = fft(Object.values(request.body.waveform));
        console.log('FFT ready: ', calculatedFFT);
        response.status(200).json({
            message: 'FFT of the signal',
            FFT: calculatedFFT
        });
    }catch (e) {
        console.log("Error: couldn't calculate FFT: ", e);
        response.status(500).json({
            message: 'something went wrong on our side'
        });
    }
});

module.exports = router;