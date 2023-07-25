import {useEffect, useRef} from "react";
import {
    calculateNewGainValue,
    drawEqualizerLine,
    drawFrameFrequencies
} from "@/util/EqualizerUtil";
import Gitarre from "@/components/svg/gitarre";

let animationController
export default function PlayerCanvas({getAnalyzer, selectedOption}) {

    const playerCanvas = useRef();

    useEffect(() => {
        draw();
    },[]);

    //TODO: refactor
    function getVolumeSamples() {
        const songData = new Uint8Array(128);
        getAnalyzer.getByteFrequencyData(songData);


        let normalSamples = [...songData].map(e => e / 128 - 1);
        let sum = 0;
        for (let i = 0; i < normalSamples.length; i++) {
// convert values between 1 and -1 to positive
            sum += normalSamples[i] * normalSamples[i];
        }
        let volume = Math.sqrt(sum / normalSamples.length)
        return volume;
    }

    const draw = () => {
        //if (!props.isPlaying) return;
        if (!getAnalyzer) return;

        // animationController = window.requestAnimationFrame(drawBandPlayer);
        //if (audioRef.current === null) return cancelAnimationFrame(animationController);
        //if (audioRef.current.paused) return cancelAnimationFrame(animationController);
        console.log("i am in Band Player")
        const songData = new Uint8Array(128);
        getAnalyzer.getByteFrequencyData(songData);

        const volume = getVolumeSamples();
        let softVolume = 0;
        softVolume = softVolume * 0.7 + volume * 0.3;
        //--------------
        const bufferL = getAnalyzer.frequencyBinCount / 2;

        const ctx = playerCanvas.current.getContext("2d");
        ctx.clearRect(0, 0, playerCanvas.current.width, playerCanvas.current.height);

        let x;
        let barWidth = 8;
        let barHeight;
        let selectedSVG;
        for (let i = 0; i < bufferL; i++) {
            //------------
            switch (selectedOption) {

                case "Gittare":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'translate(-50%, -50%) scale(' + (1 + softVolume), (softVolume + 1) + ')'
                    // Get the SVG element


// Get the path element inside the SVG
                    const pathElement = selectedSVG.querySelector('path');

// Change the fill color
                    pathElement.setAttribute('fill', "'#FFFFFF';"); // Change to white (#00FF00)
                    console.log(softVolume)
                    //pathElement.setAttribute('fill', "rgb(" + softVolume250 + "," + volume250 + "," + volume255 + ")"); // Change to green (#00FF00)

                    barHeight = songData[i] * 2;
                    ctx.save();
                    ctx.translate(playerCanvas.width / 2, playerCanvas.height / 2)
                    ctx.rotate(i * 4.7)
                    const hue = 120 + i * 0.7;

                    ctx.fillStyle = 'hsl(' + hue + ', 100%,' + barHeight / 3 + '%)';
                    ctx.beginPath();
                    ctx.arc(0, barHeight / 2, barHeight / 2, 0, Math.PI / 8);
                    ctx.fill();
                    ctx.stroke();
                    x += barWidth;
                    ctx.restore();
                    break
                case "Drums":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'translate(-50%, -50%) scale(' + (1 + softVolume), (softVolume + 1) + ')'
                    break
                case "Keyboard":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'translate(-50%, -50%) scale(' + (1 + softVolume), selectedSVG.style.transform = 'translate(-50%, -50%) scale(' + (1 + softVolume), (softVolume + 1) + ')'
                    break
                case "Saxaphone":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'translate(-50%, -50%) scale(' + (1 + softVolume), (softVolume + 1) + ')'
                    break
            }

            //-----------------
        }
        ;
        requestAnimationFrame(draw);
    }

    return(
        <>
            <div className="w-40 h-40">
                <canvas id="stage"
                        className="rounded-l-2xl border-r border-slate-600 absolute top-0 left-0 w-full h-full"
                        ref={playerCanvas} style={{
                    color: 'orange'
                }}>
                </canvas>
                {(() => {
                    switch (selectedOption) {
                        case "Gittare":
                            return <Gitarre/>;
                            break;

                    }
                })()}
            </div>
        </>
    );
}
