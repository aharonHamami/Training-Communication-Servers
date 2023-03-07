const { create, all } = require('mathjs');

const config = { }
const math = create(all, config)

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
    const X = []; // decibels per frequency
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
        console.log('k='+k+': ', Xk);
        X.push(Xk);
    }
    
    return X;
};

// this function assumes that the the signal's length is a power of 2
function calculateFFT(signal) {
    const N = signal.length;
    const halfN = Math.floor(N / 2);
    
    const X = [];
    // X.length = N;
    
    // stop condition:
    if(N == 1) {
        return [math.complex(signal[0])]; // an fft of 1 element is the same element
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
        // console.log('primitive root: ', primitiveRoot);
        // console.log('even on k: ', evenFFT[k]);
        // console.log('odd on k: ', oddFFT[k]);
        X[k] = math.add(evenFFT[k], math.multiply(primitiveRoot, oddFFT[k]));
        // Ek - Wk*Ok ; k >= N/2
        X[halfN + k] = math.subtract(evenFFT[k], math.multiply(primitiveRoot, oddFFT[k]));
    }
    
    return X;
}

const fft = (signal) => {
    const N = signal.length;
        
    // in case the signal length in not a power of 2:
    const M = Math.pow(2, Math.ceil(Math.log2(N))); // Next higher power of 2
    const paddedSignal = signal.concat(new Array(M - N).fill(0)); // Zero-padding
    
    if(M != N) console.log('<< [fft]: Warning: signal size is not a power of 2 >>');
    
    const fftOutput = calculateFFT(paddedSignal);
    const fftResult = fftOutput.slice(0, N);
    
    return fftResult;
}

const idft = (frequencies) => {
    // Idft algorithm: 
    const N = frequencies.length;
    
    // swap between real numbers and imaginary numbers:
    // reason: in order to change the direction of the samples
    const swappedFreq = frequencies.map(sample => math.complex(sample.im, sample.re));
    
    // make an fft on the swapped samples:
    const swappedDft = dft(swappedFreq);
    
    // swap again between real numbers and imaginary numbers
    const cofficient = 1/N;
    const calculatedDFT = swappedDft.map(sample => math.multiply(cofficient, math.complex(sample.im, sample.re)));
    
    return calculatedDFT;
}

const ifft = (frequencies) => {
    // Idft algorithm: 
    const N = frequencies.length;
    
    // swap between real numbers and imaginary numbers:
    // reason: in order to change the direction of the samples
    const swappedFreq = frequencies.map(sample => {
        const cmplx = math.complex(sample);
        return math.complex(cmplx.im, cmplx.re);
    });
    
    // make an fft on the swapped samples:
    const swappedDft = fft(swappedFreq);
    
    // swap again between real numbers and imaginary numbers
    const cofficient = 1/N;
    const calculatedFFT = swappedDft.map(sample => math.multiply(cofficient, math.complex(sample.im, sample.re)));
    
    return calculatedFFT;
}

function average(arr, start, end) {
    if(end <= start)
        return 0;
        
    let sum = 0;
    for(let i=start; i<end; i++) {
        sum = math.add(sum, arr[i]);
    }
    return math.divide(sum, end-start);
}

const spectralSubtraction = (signal, noise) => { // start, fftSize
    const signalSize = signal.length; // length of the entire signal
    const noiseSize = noise.length; // length of the noise signal
    const windowSize = 2**10; // length of one window (for each segment of the entire signal)
    
    // 1. Identify the noise region(s) in your signal and do an FFT on it.
    // A single noise region is enough provided that it's long enough for your FFT.
    console.log('calculate noise fft');
    const noiseFFT = fft(noise);
    
    // 2. Do the FFT on the entire signal. This may be done in multiple segments (frames).
    console.log('making segmantation');
    const segments = [];
    const fullSegments = Math.floor(signalSize/windowSize);
    for (let i = 0; i < fullSegments; i++) {
        segments.push(signal.slice(i*windowSize, (i+1)*windowSize));
    }
    
    console.log('calculating fft for each segment + substract + transfering back to signal');
    const subtractFFT = [];
    // making average from the noise fft in order to subtract him from the segment wich are the same size
    for(let i=0; i<windowSize; i++) {
        subtractFFT.push(average(noiseFFT, i*(noiseSize/windowSize), (i+1)*(noiseSize/windowSize)));
    }
    for(let index in segments) {
        // const segmentNum = parseInt(index);
        segments[index] = fft(segments[index]);
        
        // 3. In the frequency domain, subtract the result of step 1 from step 2. 
        for(let sample in segments[index]) {
            // check this out, need to be subtracted properly from all over the original fft
            // const stepA = math.complex(noiseFFT[segmentNum*segmentSize + sampleNum]);
            const stepA = math.complex(math.abs(subtractFFT[sample]));
            const stepB = math.complex(math.abs(segments[index][sample]));
            segments[index][sample] = math.subtract(stepB, stepA);
        }
        
        // 4. Do an inverse fft, which will bring your signal back into the time domain.
        segments[index] = ifft(segments[index]);
    }
    
    // connect back the signal:
    const clearSignal = segments.reduce((connected, segment) => connected.concat(segment));
    
    return clearSignal;
}

module.exports =  {fft, dft, ifft, idft, spectralSubtraction};