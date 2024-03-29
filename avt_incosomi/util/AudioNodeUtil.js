import {calculatePeakingFrequency, calculatePeakingQFactor} from "@/util/EqualizerUtil";
import {calcImpulseResponse_Simple, getImpulseResponse} from "@/util/ReverbCalculatorUtil";

export function startAudio (isPlaying, audioSource, audioCtx, startTime) {
    if(!isPlaying)return 0;
    audioSource.start(startTime);
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

export function setupLowShelfFilterNode(audioCtx, frequency){
    let lowShelfFilterNode = audioCtx.createBiquadFilter();
    lowShelfFilterNode.type = "lowshelf";
    lowShelfFilterNode.frequency.value = frequency;
    return lowShelfFilterNode;
}

export function setupPeakingFilterNode(audioCtx, lowShelf_Frequency, highShelf_Frequency){
    let peaking_Frequency = calculatePeakingFrequency(lowShelf_Frequency, highShelf_Frequency);
    let peaking_q = calculatePeakingQFactor(peaking_Frequency, lowShelf_Frequency, highShelf_Frequency);
    let peakingFilterNode = audioCtx.createBiquadFilter();
    peakingFilterNode.type = "peaking";
    peakingFilterNode.frequency.value = peaking_Frequency;
    peakingFilterNode.Q.value = peaking_q;
    return peakingFilterNode;
}

export function setupHighShelfFilterNode(audioCtx, frequency) {
    let  highShelfFilterNode = audioCtx.createBiquadFilter();
    highShelfFilterNode.type = "highshelf";
    highShelfFilterNode.frequency.value = frequency;
    return highShelfFilterNode;
}

export function setupConvolverNode(audioCtx, reverbType, arrayBuffer) {
    let impulseResponse;
    if(arrayBuffer) {
        impulseResponse = getImpulseResponse(audioCtx, arrayBuffer);
    }else {
        impulseResponse = calcImpulseResponse_Simple(1, 2, audioCtx);
    }
    return new ConvolverNode(audioCtx, {buffer: impulseResponse});
}

