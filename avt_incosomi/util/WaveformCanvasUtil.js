
export function calcCursorPosition(maxDuration, currentTime, currentTimeOffset, canvasWidth){
    const currentTimeToPixelLocationFactor = calcTimeToPixelFactor(maxDuration, canvasWidth);
    const contextTimeWithoutOffset = currentTime - currentTimeOffset;
    const currentBufferTime = contextTimeWithoutOffset - (Math.floor(contextTimeWithoutOffset / maxDuration) * maxDuration);
    return Math.floor(currentBufferTime / currentTimeToPixelLocationFactor);
}

export function calcTimeToPixelFactor(duration, width) {
    let pixelPerSec = width/duration;
    let pixelPerMilliSec = pixelPerSec/10;
    return 0.1 / pixelPerMilliSec;
}
