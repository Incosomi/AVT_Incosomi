
export function calcImpulseResponse_Simple(duration, decay, audioCtx){
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

export function getImpulseResponse(audioCtx, arrayBuffer) {
    return audioCtx.decodeAudioData(arrayBuffer);
}
