import {forwardRef, useEffect, useImperativeHandle, useRef} from "react";

let animationController;

const WaveformCanvas = forwardRef(
    function WaveformCanvas({isPlaying, getCurrentTime, getTimeOffSet, getDuration}, ref) {
        const canvasBgColor = '#f5980a';
        const waveformColor = '#607aee';
        const cursorColor = '#000000';

        const canvasRef = useRef(null);
        const canvasCtx = useRef(null);
        const canvasWidth = useRef(0);
        const canvasHeight = useRef(0);

        const waveformImgData = useRef(null);
        const maxDurationRef = useRef(2 );
        const startedPlaying = useRef(false);

        useEffect(() => {
            canvasCtx.current = canvasRef.current.getContext("2d");
            canvasWidth.current = canvasRef.current.clientWidth;
            canvasHeight.current = canvasRef.current.clientHeight;
        },[]);

        useImperativeHandle(ref, () => {
            return{
                drawWaveForm(trimmedChannelData) {
                    drawWaveformImpl(trimmedChannelData);
                }
            };
        },[]);

        useEffect(() => {
            if(isPlaying && !startedPlaying.current){
                animateWaveformCursor();
            }
        },[isPlaying])

        const drawWaveformImpl = (trimmedChannelData) => {
            canvasCtx.current.fillStyle = canvasBgColor;
            canvasCtx.current.fillRect(0, 0, canvasWidth.current, canvasHeight.current);
            canvasCtx.current.fillStyle  = waveformColor;

            const chunkSize = Math.max(1, Math.floor(trimmedChannelData.length / canvasWidth.current));

            for (let x = 0; x < canvasWidth.current; x++) {
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
                let rectHeight = Math.max(1, chunkAmp * canvasHeight.current)*10;
                let y = canvasHeight.current / 2 - rectHeight / 2;
                canvasCtx.current.fillRect(x, y, 1, rectHeight);
            }
            waveformImgData.current = canvasCtx.current.getImageData(0, 0, canvasWidth.current, canvasHeight.current);
        }

        const animateWaveformCursor = () => {
            animationController = window.requestAnimationFrame(animateWaveformCursor);
            if (canvasRef.current === null) return cancelAnimationFrame(animationController);
            if (waveformImgData.current === null) return;

            const canvasCtx = canvasRef.current.getContext('2d');
            const width = canvasRef.current.clientWidth;
            const height = canvasRef.current.clientHeight;

            const duration = getDuration();
            const currentTime = getCurrentTime();
            const currentTimeOffSet = getTimeOffSet();
            const currentTimeToPixelLocationFactor = calcCurrentTimeToPixelLocationFactor(duration, width);
            const contextTimeWithoutOffset = currentTime - currentTimeOffSet;
            const currentBufferTime = contextTimeWithoutOffset - (Math.floor(contextTimeWithoutOffset / maxDurationRef.current) * maxDurationRef.current);
            let cursorPos = Math.floor(currentBufferTime / currentTimeToPixelLocationFactor);

            createImageBitmap(waveformImgData.current)
                .then(image => canvasCtx.drawImage(image, 0, 0));

            canvasCtx.fillStyle = cursorColor;
            canvasCtx.fillRect(cursorPos, 0, 1, height);
        }

        const calcCurrentTimeToPixelLocationFactor = (duration, width) => {
            let pixelPerSec = width/duration;
            let pixelPerMilliSec = pixelPerSec/10;
            return 0.1 / pixelPerMilliSec;
        }

        return (
                <canvas id="waveform" className="rounded-2xl border border-black bg-orange-400" ref={canvasRef} width={200} height={53} />
        );
    });

export default WaveformCanvas;
