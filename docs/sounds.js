
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let oscillator;

function playTone(frequency) {
    if (oscillator) {
        oscillator.stop();
    }

    oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // You can change this to 'square', 'sawtooth', or 'triangle'
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
}

function stopTone() {
    if (oscillator) {
        oscillator.stop();
        oscillator = null;
    }
}