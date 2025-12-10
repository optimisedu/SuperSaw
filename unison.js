//UNISION
/*
Basic unison/supersaw implimentation in this case.
Creates two arrays of oscillators detuned in opposite directions based on their index number. #
Pans one array left and the other right for stereo for classic widening effect.

Ideas - 
- Add controls for detune amount, number of oscillators, waveform type.
- Add UI elements for real-time control.
- Modulate - I am currently taking appart different synthesisizers I have created in the past, and improving their flexibility.
my long term goal with this is to create a modular sythesis framework/library in vanilla js
- Plenty of space for optimisation. Regarding the modulation as well - as this can be seen as a unison "plugin" there is probably a MUCH better way of visualising this
*/

const ac = new AudioContext();
const analyser = ac.createAnalyser();
analyser.fftSize = 2048;
let len = 8;  // reactive total number of voices

//MAIN LEFT AND RIGHT ARRAYS
const lArr = [];  
const rArr = [];  

let voice = document.getElementById("voices");
voice.addEventListener("change", (event) => {
    len = event.target.value
    document.getElementById("uniValue").innerText = len
    }
    );

    
// Function to fill the arrays with oscillators
function fillArr(arr, len, detuneDirection) {
    arr.length = 0;  // Clear the array
    for (let i = 0; i < len; i++) {
        const oscillator = ac.createOscillator();
        oscillator.type = "sawtooth";  // Sawtooth wave for rich sound
        oscillator.frequency.setValueAtTime(110, ac.currentTime);  // Set frequency for each oscillator

        // Detune oscillators: positive detune for left and negative for right
        const detuneAmount = (i + 1) * 5;  // Increase detune for each oscillator in the array
        oscillator.detune.setValueAtTime(detuneDirection * detuneAmount, ac.currentTime);

        oscillator.connect(analyser);  // Connect to analyser node for visualization
        arr.push(oscillator);  // Add oscillator to array
    }
}

// Fill the main array with oscillators (split into two arrays)
//quick example of how to incrimentally detune based on number of voices 
fillArr(lArr, len / 2, 1/(len/2))
fillArr(rArr, len / 2, -1*(len/2));  
console.log("Left Array (detuned positively):", lArr);
console.log("Right Array (detuned negatively):", rArr);

// Function to apply stereo panning for unison effect
function splitOsc(lArr, rArr) {
//TODO - make the unison blend better with incrimental panning based on number of voices

    const lPan = ac.createStereoPanner();
    const rPan = ac.createStereoPanner();

    lPan.pan.setValueAtTime(-1, ac.currentTime); 
    lArr.forEach(o => o.connect(lPan));  // Connect all left oscillators to left panner

    rPan.pan.setValueAtTime(1, ac.currentTime);  
    rArr.forEach(o => o.connect(rPan));  // Connect all right oscillators to right panner
    
    lPan.connect(ac.destination);
    rPan.connect(ac.destination);
}

splitOsc(lArr, rArr);


function startOsc() {
    [...lArr, ...rArr].forEach(o => o.start());  
}

function stopOsc() {
    [...lArr, ...rArr].forEach(o => {
        o.stop();
        o.disconnect();  
    });
        //clear arrays to prevent restarting errors, duplicated nodes and other memory leaks
    lArr.length = 0;  
    rArr.length = 0;  
}

// ANALYSER AND CANVAS DRAWING - VERY BASIC, NEEDS WORK
function draw() {
    requestAnimationFrame(draw);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const canvas = document.getElementById("analyser");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00ff00";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

draw();

// Start and Stop Event Listeners
document.getElementById("start").addEventListener("click", () => {
    fillArr(lArr, len / 2, 1/(len / 2))
    fillArr(rArr, len / 2, -1*(len / 2)); 
    splitOsc(lArr, rArr);  // Apply stereo panning
    startOsc();  // Start all oscillators
});

document.getElementById("stop").addEventListener("click", () => {
    stopOsc();
});
