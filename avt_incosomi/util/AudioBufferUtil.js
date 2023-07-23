
export function trimAudioBufferToMax (audioBuf, maxDuration, channel){
    if (maxDuration <= audioBuf.duration) {
        const sampleCountToKeep = audioBuf.sampleRate * maxDuration
        return audioBuf
            .getChannelData(channel)
            .slice(0, sampleCountToKeep);
    }
    const durationDif = Math.floor(maxDuration - audioBuf.duration);
    let difArray = new Float32Array(durationDif * audioBuf.sampleRate).fill(0);
    return Float32Array.from([...audioBuf.getChannelData(0), ...difArray]);
}
