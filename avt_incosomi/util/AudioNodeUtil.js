
export function startAudio (isPlaying, audioSource, audioCtx) {
    if(!isPlaying)return 0;
    audioSource.start();
    return audioCtx.currentTime;
}

export function setupAudioSourceNode(audioCtx, audioBuffer){
    let audioSrc = audioCtx.createBufferSource();
    audioSrc.buffer = audioBuffer;
    audioSrc.loop = true;
    return audioSrc;
}

export function setupVolumeNode(audiCtx){
    let volumeNode = audiCtx.createGain();
    volumeNode.gain.value = 1;
    return volumeNode;
}

export function setupLowPassFilterNode(audioCtx){
    let lowPassFilterNode = audioCtx.createBiquadFilter();
    lowPassFilterNode.type = "lowpass";
    lowPassFilterNode.frequency.value = 5000;
    return lowPassFilterNode;
}

export function setUpHighPassFilterNode(audioCtx) {
    let  highPassFilterNode = audioCtx.createBiquadFilter();
    highPassFilterNode.type = "highpass";
    highPassFilterNode.frequency.value = 5000;
    return highPassFilterNode;
}

export function setUpConvolverNode(audioCtx){
    let impulse = calcImpulseResponse(1, 2, audioCtx);
    return new ConvolverNode(audioCtx, {buffer:impulse});
}

function calcImpulseResponse(duration, decay, audioCtx){
    let length =
        audioCtx.sampleRate * duration;
    let impulse =
        audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    let ir =
        impulse.getChannelData(0);
    for (let i=0; i<length; i++){
        ir[i] = (2 * Math.random() - 1) * Math.pow(1 - i / length, decay);
    }
    return impulse;
}
