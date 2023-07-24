import {useEffect, useRef} from "react";
import {
    calculateNewGainValue,
    drawEqualizerLine,
    drawFrameFrequencies
} from "@/util/EqualizerUtil";

let animationController
export default function EqualizerCanvas({getAnalyzer, getFrameFrequencyData,
                                            getLowFrequency, getLowGain, setLowGain,
                                            getPeakingFrequency, getPeakingGain, setPeakingGain,
                                            getHighFrequency, getHighGain, setHighGain}) {

    const canvasRef = useRef(null);

    const hzToPixelRatio = useRef(0);

    const activeFilter = useRef("NONE");

    useEffect(() => {
        canvasRef.current.onwheel = (event) => {
            if (getAnalyzer() != null) {
                switch (activeFilter.current) {
                    case "lowshelf":
                        setLowGain(calculateNewGainValue(getLowGain(), -event.deltaY));
                        break;
                    case "peaking":
                        setPeakingGain(calculateNewGainValue(getPeakingGain(), -event.deltaY));
                        break;
                    case "highshelf":
                        setHighGain(calculateNewGainValue(getHighGain(), -event.deltaY));
                        break;
                }
            }
            event.preventDefault();
        };
        canvasRef.current.onmousemove = (event) => {
            if (getAnalyzer() != null){
                let canvasBounds = canvasRef.current.getBoundingClientRect();
                let mouseX = event.clientX - canvasBounds.left;
                if(mouseX <= getLowFrequency() * hzToPixelRatio.current) {
                    activeFilter.current = "lowshelf";
                    return;
                }
                if(mouseX <= getHighFrequency() * hzToPixelRatio.current){
                    activeFilter.current = "peaking";
                    return;
                }
                if(mouseX > getHighFrequency() * hzToPixelRatio.current)activeFilter.current = "highshelf";
            }
        }
        hzToPixelRatio.current = canvasRef.current.width / 24000;
        draw();
    },[]);

    const draw = () => {
        animationController = window.requestAnimationFrame(draw);
        if (canvasRef.current == null) return cancelAnimationFrame(animationController);
        if (getAnalyzer() == null) return;

        const canvasCtx = canvasRef.current.getContext("2d");
        getAnalyzer().fftSize = 512;
        const songData = new Uint8Array(getAnalyzer().frequencyBinCount);
        getFrameFrequencyData(songData);

        let lowShelf_Frequency = getLowFrequency();
        let highshelf_Frequency = getHighFrequency();
        let peaking_Frequency = getPeakingFrequency();
        let lowShelf_Gain = getLowGain();
        let peaking_Gain = getPeakingGain();
        let highShelf_Gain = getHighGain();

        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawFrameFrequencies(canvasCtx, canvasRef.current.width, canvasRef.current.height, songData, getAnalyzer().frequencyBinCount);
        drawEqualizerLine(canvasCtx, canvasRef.current.width, canvasRef.current.height,
            lowShelf_Frequency, lowShelf_Gain,
            highshelf_Frequency, highShelf_Gain,
            peaking_Frequency, peaking_Gain,
            hzToPixelRatio.current);
    }

    return(
        <>
            <canvas id="equalizer" className="rounded-2xl border border-black bg-orange-400" ref={canvasRef} width={200} height={53}/>
        </>
    );
}
