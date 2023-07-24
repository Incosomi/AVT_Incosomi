
export function calculatePeakingFrequency(lowShelfFrequency, highShelfFrequency){
    return Math.sqrt(highShelfFrequency * lowShelfFrequency);
}

export function calculatePeakingQFactor(peakingFrequency, lowshelfFrequency, highshelfFrequency) {
    return peakingFrequency / (highshelfFrequency - lowshelfFrequency);
}

export function calculateNewGainValue(previousGain, deltaY){
    if(deltaY < 0 && previousGain > -40) return previousGain - 1;
    if(deltaY > 0 && previousGain < 40) return previousGain + 1;
    return previousGain;
}


export function drawFrameFrequencies(canvasCtx, width, height, songData, bufferLength){
    const bar_width = width / bufferLength;

    for (let i = 0; i < songData.length; i++) {
        let gradient = canvasCtx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0.2, "#2392f5");
        gradient.addColorStop(0.5, "#fe0095");
        gradient.addColorStop(1.0, "#e500fe");
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(i, height-1.5, bar_width, -songData[i] / 5);
    }
}

export function drawEqualizerLine(canvasCtx,
                                  width, height,
                                  lowshelf_Frequency, lowshelf_Gain,
                                  highshelf_Frequency, highshelf_Gain,
                                  peaking_Frequency, peaking_Gain,
                                  hzToPixelRation){
    let canvasHeightMiddle = height / 2;

    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvasHeightMiddle - lowshelf_Gain);
    canvasCtx.lineTo(lowshelf_Frequency * hzToPixelRation, canvasHeightMiddle);
    canvasCtx.lineTo(peaking_Frequency * hzToPixelRation, canvasHeightMiddle - peaking_Gain);
    canvasCtx.lineTo(highshelf_Frequency * hzToPixelRation, canvasHeightMiddle);
    canvasCtx.lineTo(width, canvasHeightMiddle - highshelf_Gain);

    canvasCtx.font = "8.5px Arial";
    canvasCtx.fillStyle = "blue";
    canvasCtx.textAlign = "center";

    let lowShelf_X = lowshelf_Frequency * hzToPixelRation;
    let lowShelf_Y = canvasHeightMiddle;
    canvasCtx.moveTo(lowShelf_X, lowShelf_Y);
    canvasCtx.lineTo(lowShelf_X, lowShelf_Y-9);
    canvasCtx.fillText(Math.round(lowshelf_Frequency/1000)+" kHz", lowShelf_X, lowShelf_Y-10);

    let peaking_X = peaking_Frequency * hzToPixelRation;
    let peaking_Y = canvasHeightMiddle - peaking_Gain;
    canvasCtx.moveTo(peaking_X, peaking_Y);
    canvasCtx.lineTo(peaking_X, peaking_Y+8);
    canvasCtx.fillText(Math.round(peaking_Frequency/1000)+" kHz", peaking_X, peaking_Y+15);

    let highShelf_X = highshelf_Frequency * hzToPixelRation;
    let highShelf_Y = canvasHeightMiddle
    canvasCtx.moveTo(highShelf_X, highShelf_Y);
    canvasCtx.lineTo(highShelf_X, highShelf_Y-9);
    canvasCtx.fillText(Math.round(highshelf_Frequency/1000)+" kHz", highShelf_X, highShelf_Y-10);

    canvasCtx.stroke();
}
