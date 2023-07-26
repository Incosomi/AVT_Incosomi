import {useEffect, useRef} from "react";
import {
    calculateNewGainValue,
    drawEqualizerLine,
    drawFrameFrequencies
} from "@/util/EqualizerUtil";
import Guitar from "@/components/svg/guitar";

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

        const songData = new Uint8Array(128);
        getAnalyzer.getByteFrequencyData(songData);

        const volume = getVolumeSamples();
        let softVolume = 0;
        softVolume = softVolume * 0.7 + volume * 0.3;
        //--------------
        const bufferL = getAnalyzer.frequencyBinCount / 2 ;

        const ctx = playerCanvas.current.getContext("2d");
        ctx.clearRect(0, 0, playerCanvas.current.width, playerCanvas.current.height);


        let barWidth = 8;
        let barHeight;
        let selectedSVG;
        for (let i = 0; i < bufferL; i++) {
            //------------
            switch (selectedOption) {

                case "Guitar":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'scale(' + (1 + softVolume), (softVolume + 1) + ')'
                    selectedSVG.style.opacity =volume *1.5
                    //defining the degree of the color wheel
                    const  hue4 = 240 + i * volume;
                    // Get a path element inside the SVG
                    const pathElementGuitar = selectedSVG.querySelector('path');
                    // Change the fill color
                    pathElementGuitar.setAttribute('fill', "#000000"); // Change to white (#00FF00)
                    pathElementGuitar.setAttribute('fill', "rgb(" + volume*300 + "," + volume*100 + "," + volume*250 + ")"); // Change to green (#00FF00)
                    barHeight = songData[i] /2;
                    ctx.save();
                    ctx.translate(playerCanvas.current.width / 2, playerCanvas.current.height / 2)
                    ctx.rotate(i * -0.004)
                    ctx.strokeStyle = 'hsl(' + hue4 + ', 70%, 60%)';
                    ctx.beginPath();
                    ctx.moveTo(0,i*0.7)
                    ctx.bezierCurveTo(-barHeight*0.4, i*0.9+barHeight*0.2, -barHeight*0.5, barHeight*0.5, -barHeight*2, i*0.6)
                    ctx.arc(0, barHeight / 2, barHeight / 2, 0, Math.PI / 8);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                    break
                case "Drums":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'scale(' + (1 + softVolume), (softVolume + 1) + ')'
                    selectedSVG.style.opacity =volume *1.5;
                    // Get a path element inside the SVG
                    const pathElementDrums = selectedSVG.querySelector('path');
                    // Change the fill color to white
                    pathElementDrums.setAttribute('fill', "#000000"); // Change to white (#00FF00)
                    // then give it color based on the volume samples
                    pathElementDrums.setAttribute('fill', "rgb(" + volume*100 + "," + volume*350 + "," + volume*150 + ")"); // Change to green (#00FF00)
                    barHeight = songData[i]/6;
                    ctx.save();
                    ctx.translate(playerCanvas.current.width / 2, playerCanvas.current.height / 4)
                    ctx.rotate(i * 3)
                    const hue2 =  i /55 ;
                    ctx.strokeStyle = 'hsl(' + hue2 + ', 50%,' + barHeight*2  + '%, 0.9';
                    ctx.beginPath();
                    ctx.moveTo(0,i*0.7)
                    ctx.arc(0, barHeight *2.88, barHeight/3, 0, Math.PI *2);
                    ctx.stroke();

                    ctx.restore();
                    break
                case "Keyboard":
                    selectedSVG = document.getElementById(selectedOption);

                    // creating the impulse of the avatars
                    selectedSVG.style.transform = 'scale(' + (1 + softVolume), (softVolume + 1) + ')'
                    // changing the opacity based on the voice samples
                    selectedSVG.style.opacity =softVolume

                    const pathElementKeyboard = selectedSVG.querySelector('.selected-path');
                    // Change to white to rest the color and regenerate it
                    pathElementKeyboard.setAttribute('fill', "#000000");
                    const hue3 = i*7  ;
                    const hslColor = `hsl(${hue3}, 100%, 50%)`;
                    pathElementKeyboard.setAttribute('fill', "rgb(" + volume*300+ "," + 100*volume + "," + 350*softVolume + ")");
                    barHeight =songData[i] * 0.55;
                    // save the current state of the context before rotating it
                    ctx.save();

                    // ctx.translate(playerCanvas.current.width/8, playerCanvas.current.height/8)
                    ctx.rotate(Math.PI*songData[i])
                    ctx.strokeStyle =  hslColor;
                    ctx.strokeWidth = volume*1000;
                    ctx.fillStyle=hslColor;
                    //---------
                    // ctx.beginPath()
                    // ctx.moveTo(i/6, barHeight/4)
                    // ctx.lineTo(songData[i]/4, songData[i]/12)
                    // ctx.stroke();
                    // ctx.fillRect(0,0, barWidth/6, barHeight/4);
                    // restore the context after the drawing
                    //------

                    ctx.beginPath();
                    ctx.arc(barHeight+75, barHeight+75, 50, 0, Math.PI*2)
                    ctx.moveTo(barHeight+110,barHeight+175)
                    ctx.arc(barHeight+75, barHeight+75, 35, 0, Math.PI)
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(barHeight+65,barHeight+ 65, 5, 0, Math.PI*2)
                    ctx.moveTo(barHeight+96,barHeight+56)
                    ctx.arc(barHeight+90,barHeight+ 65, 5, 0, Math.PI*2)
                    ctx.fill();


                    ctx.restore()


                    break
                case "Saxophone":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'scale(' + (1 + softVolume), (softVolume + 1) + ')'
                    selectedSVG.style.opacity =0.8*volume
                    const pathElement = selectedSVG.querySelector('path');
                    // Change the fill color to white and then give it another color value based on the volume sample
                    pathElement.setAttribute('fill', "#000000"); // Change to white (#00FF00)
                    pathElement.setAttribute('fill', "rgb(" + volume*300 + "," + volume*100 + "," + volume*250 + ")");
                    let color = 'hsl(' + i*2.13 + ',80%,50%)';
                    const pathElement2 = selectedSVG.querySelector('.selected-path');
                    pathElement2.setAttribute('fill', "rgb(" + softVolume*230 + "," + volume*90 + "," + volume*300 + ")"); // Change to green (#00FF00)
                    barHeight =songData[i] *0.4;
                    ctx.save();
                    ctx.translate(playerCanvas.current.width/2, playerCanvas.current.height/2)
                    ctx.rotate(i*Math.PI/bufferL)
                    ctx.fillStyle =color
                    ctx.lineWidth = barHeight/20;
                    ctx.beginPath();
                    ctx.arc(0,1.5*barHeight, barHeight/20,0, Math.PI*2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(0,1.5*barHeight, barHeight/5,0, Math.PI*6)
                    ctx.restore();
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
                {/*{(() => {*/}
                {/*    switch (selectedOption) {*/}
                {/*        case "Gittare":*/}
                {/*            return <Guitar/>;*/}
                {/*            break;*/}

                {/*    }*/}
                {/*})()}*/}
            </div>
        </>
    );
}
