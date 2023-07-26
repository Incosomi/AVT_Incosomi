import {useEffect, useRef} from "react";
import {calcCursorPosition} from "@/util/WaveformCanvasUtil";

let animationController;

export function WaveformCanvas({
                                   shouldDrawCursor,
                                   getTrimmedChannelData,
                                   getCurrentTime,
                                   getTimeOffSet,
                                   getMaxDuration
                               }) {
    const canvasBgColor = '#f5980a';
    const waveformColor = '#607aee';
    const cursorColor = '#000000';

    const canvasRef = useRef(null);
    const canvasCtx = useRef(null);
    const canvasWidth = useRef(0);
    const canvasHeight = useRef(0);

    const waveformImgData = useRef(null);

    useEffect(() => {
        canvasWidth.current = canvasRef.current.width;
        canvasHeight.current = canvasRef.current.height;
        draw();
    }, [])

    const draw = () => {
        animationController = window.requestAnimationFrame(draw);
        if (canvasRef.current === null) return cancelAnimationFrame(animationController);
        canvasCtx.current = canvasRef.current.getContext("2d");
        if (waveformImgData.current == null) {
            let trimmedChannelData = getTrimmedChannelData();
            if (trimmedChannelData == null) return;
            waveformImgData.current =
                drawWaveformImpl(trimmedChannelData, canvasCtx.current, canvasWidth.current, canvasHeight.current);
        }
        if (!shouldDrawCursor()) return;
        drawWaveformCursor(waveformImgData.current, canvasCtx.current, canvasWidth.current, canvasHeight.current);
    }

    const drawWaveformImpl = (trimmedChannelData, canvasCtx, canvasWidth, canvasHeight) => {
        canvasCtx.fillStyle = canvasBgColor;
        canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        canvasCtx.fillStyle = waveformColor;

        const chunkSize = Math.max(1, Math.floor(trimmedChannelData.length / canvasWidth));

        for (let x = 0; x < canvasWidth; x++) {
            const start = x * chunkSize;
            const end = start + chunkSize;
            const chunk = trimmedChannelData.slice(start, end);
            let positive = 0;
            let negative = 0;
            chunk.forEach(val => {
                if (val > 0) positive += val;
                if (val < 0) negative += val;
            });

            negative /= chunk.length;//mittelwert der positiven ausschlaege
            positive /= chunk.length;//mittelwert der negativen ausschlaege
            let chunkAmp = positive - negative;
            let rectHeight = Math.max(1, chunkAmp * canvasHeight) * 10;
            let y = canvasHeight / 2 - rectHeight / 2;
            canvasCtx.fillRect(x, y, 1, rectHeight);
        }
        return canvasCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    }

    const drawWaveformCursor = (waveformImgData, canvasCtx, canvasWidth, canvasHeight) => {
        let cursorPos = calcCursorPosition(getMaxDuration(), getCurrentTime(), getTimeOffSet(), canvasWidth);

        createImageBitmap(waveformImgData)
            .then(image => canvasCtx.drawImage(image, 0, 0));

        canvasCtx.fillStyle = cursorColor;
        canvasCtx.fillRect(cursorPos, 0, 1, canvasHeight);
    }

    return (
        <canvas id="waveform" className="rounded-2xl border border-black bg-orange-400" ref={canvasRef} width={200}
                height={53}/>
    );
}
