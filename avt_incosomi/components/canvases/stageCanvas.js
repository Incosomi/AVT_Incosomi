import Image from "next/image";
import Guitar from "@/components/svg/guitar";
import Drums from "@/components/svg/drums";
import Saxophone from "@/components/svg/saxophone";
import Keyboard from "@/components/svg/keyboard";
import {useEffect, useRef, useState} from "react";

let animationController;

export function StageCanvas({getAnalyzer, getSelectedOption}) {

    const canvasRef = useRef(null);
    const [randomPercentage, setRandomPercentage] = useState(() => getRandomPercentage());

    useEffect(()=> {
       draw();
    },[]);

    function getRandomPercentage() {
        const randomNumber = Math.floor(Math.random() * 13);
        const randomStep = randomNumber * 10;
        return randomStep - 60;
    }

    function getVolumeSamples(songData) {
        let normalSamples = [...songData].map(e => e / 128 - 1);
        let sum = 0;
        for (let i = 0; i < normalSamples.length; i++) {
            // convert values between 1 and -1 to positive
            sum += normalSamples[i] * normalSamples[i];
        }
        return Math.sqrt(sum / normalSamples.length);
    }

    const songData = new Uint8Array(128);

    const draw = () => {
        animationController = window.requestAnimationFrame(draw);
        if (canvasRef.current == null) return cancelAnimationFrame(animationController);
        const ctx = canvasRef.current.getContext("2d");
        const selectedOption = getSelectedOption();
        renderSwitch(selectedOption);
        if (selectedOption === ""){
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            return ;
        }
        const selectedSVG = document.getElementById(selectedOption);
        if (selectedSVG == null) return;
        const analyzer = getAnalyzer();
        if (analyzer == null) return;

        analyzer.getByteFrequencyData(songData);
        //const volume = getVolumeSamples(songData);
        let softVolume = 0;
        const bufferL = analyzer.frequencyBinCount / 2;


        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        //let x;
        //let barWidth = 8;
        let barHeight;

        selectedSVG.style.transform = 'scale(' + (1 + softVolume), (softVolume + 1) + ')';
        const pathElement = selectedSVG.querySelector('path');
        pathElement.setAttribute('fill', "'#FFFFFF';");

        for (let i = 0; i < bufferL; i++) {
            barHeight = songData[i] * 2;
            drawEffects(ctx, barHeight, i);
        }
    };

    const drawEffects = (ctx, barHeight, iteration) => {
        ctx.save();
        ctx.translate(canvasRef.current.width / 2, canvasRef.current.height / 2);
        ctx.rotate(iteration * 4.7)
        const hue = 120 + iteration * 0.7;
        ctx.fillStyle = 'hsl(' + hue + ', 100%,' + barHeight / 3 + '%)';
        ctx.beginPath();
        ctx.arc(0, barHeight / 2, barHeight / 2, 0, Math.PI / 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    const [svg, setSvg] = useState(<></>);

    const renderSwitch = (option) => {
        switch (option){
            case "Guitar":
                setSvg(<Guitar/>);
                break;
            case "Drums": setSvg(<Drums/>);
                break;
            case "Saxophone": setSvg(<Saxophone/>);
                break;
            case "Keyboard": setSvg(<Keyboard/>);
                break;
            default: setSvg(<></>);
        }
    }

    return(
        <div className="flex flex-row relative">
            <div id="background" className="flex flex-row">
                <Image src={"/stage_tile_flaeche_01.png"} alt="background" width={150} height={50}/>
                <Image src={"/stage_tile_flaeche_01.png"} alt="background" width={150} height={50}/>
                <Image src={"/stage_tile_flaeche_01.png"} alt="background" width={150} height={50}/>
                <Image src={"/stage_tile_flaeche_01.png"} alt="background" width={150} height={50}/>
                <Image src={"/stage_tile_flaeche_01.png"} alt="background" width={150} height={50}/>
                <Image src={"/stage_tile_flaeche_01.png"} alt="background" width={150} height={50}/>
                <Image src={"/stage_tile_flaeche_01.png"} alt="background" width={150} height={50}/>
            </div>
            <div id="overlap"
                 className="absolute top-0 rounded-md z-10"
                 style={{ right: `${randomPercentage}%` }}>
                <div className="w-32 h-32">
                    <canvas id="stage"
                            className="rounded-l-2xl absolute w-full h-full"
                            ref={canvasRef}
                            style={{color: 'orange'}}>
                    </canvas>
                    <div id="avatar" className="">
                        {svg}
                    </div>
                </div>
            </div>
        </div>
    );
}
