import Image from "next/image";
import Guitar from "@/components/svg/guitar";
import Drums from "@/components/svg/drums";
import Saxophone from "@/components/svg/saxophone";
import Keyboard from "@/components/svg/keyboard";
import {useEffect, useRef, useState} from "react";

let animationController;

export function StageCanvas({getAnalyzer, getSelectedOption}) {

    const canvasRef = useRef(null);

    useEffect(() => {
        draw();
    }, []);


    const [svg, setSvg] = useState(<></>);

    const [dragging, setDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [overlapDivLeft, setOverlapDivLeft] = useState(0);

    function getVolumeSamples(songData) {
        let normalSamples = [...songData].map(e => e / 128 - 1);
        let sum = 0;
        for (let i = 0; i < normalSamples.length; i++) {

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
        if (selectedOption === "") {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            return;
        }
        const selectedSVG = document.getElementById(selectedOption);
        if (selectedSVG == null) return;
        const analyzer = getAnalyzer();
        if (analyzer == null) return;

        analyzer.getByteFrequencyData(songData);
        const volume = getVolumeSamples(songData);
        let softVolume = 0;
        softVolume = softVolume * 0.7 + volume * 0.3;
        const bufferL = analyzer.frequencyBinCount / 2;


        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);


        selectedSVG.style.transform = 'scale(' + (1 + softVolume), (softVolume + 1) + ')';
        selectedSVG.style.opacity = volume * 1.5;

        const pathElement = selectedSVG.querySelector('path');
        pathElement.setAttribute('fill', "#000000");

        pathElement.setAttribute('fill', "'#FFFFFF';");

        for (let i = 0; i < bufferL; i++) {
            switch (selectedOption) {
                case "Guitar":
                    drawGuitar(pathElement, ctx, songData, volume, i);
                    break;
                case "Drums":
                    drawDrums(pathElement, ctx, songData, volume, i);
                    break;
                case "Keyboard":
                    drawKeyboard(pathElement, ctx, songData, volume, i, softVolume);
                    break;
                case "Saxophone":
                    drawSaxophone(pathElement, ctx, songData, volume, i, bufferL);
                    break;
            }

        }
    };

    function drawGuitar(pathElement, ctx, songData, volume, iterator) {
        pathElement.setAttribute('fill', "rgb(" + volume * 300 + "," + volume * 100 + "," + volume * 250 + ")");

        const hue4 = 240 + iterator * volume;
        ctx.strokeStyle = 'hsl(' + hue4 + ', 70%, 60%)';

        const barHeight = songData[iterator] / 2;
        ctx.save();
        ctx.translate(canvasRef.current.width / 2, canvasRef.current.height / 2)
        ctx.rotate(iterator * -0.004)
        ctx.beginPath();
        ctx.moveTo(0, iterator * 0.7)
        ctx.bezierCurveTo(-barHeight * 0.4, iterator * 0.9 + barHeight * 0.2, -barHeight * 0.5, barHeight * 0.5, -barHeight * 2, iterator * 0.6)
        ctx.arc(0, barHeight / 2, barHeight / 2, 0, Math.PI / 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    function drawDrums(pathElement, ctx, songData, volume, iterator) {
        pathElement.setAttribute('fill', "rgb(" + volume * 100 + "," + volume * 350 + "," + volume * 150 + ")");

        const barHeight = songData[iterator] / 6;
        const hue2 = iterator / 55;
        ctx.strokeStyle = 'hsl(' + hue2 + ', 50%,' + barHeight * 2 + '%, 0.9';


        ctx.save();
        ctx.translate(canvasRef.current.width / 2, canvasRef.current.height / 4)
        ctx.rotate(iterator * 3)
        ctx.beginPath();
        ctx.moveTo(0, iterator * 0.7)
        ctx.arc(0, barHeight * 2.88, barHeight / 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    function drawKeyboard(pathElement, ctx, songData, volume, iterator, softVolume) {
        pathElement.setAttribute('fill', "rgb(" + volume * 300 + "," + 100 * volume + "," + 350 * softVolume + ")");

        const hue3 = iterator * 7;
        const hslColor = `hsl(${hue3}, 100%, 50%)`;

        const barHeight = songData[iterator] * 0.55;
        ctx.save();

        ctx.rotate(Math.PI * songData[iterator])
        ctx.strokeStyle = hslColor;
        ctx.strokeWidth = volume * 1000;
        ctx.fillStyle = hslColor;-

        ctx.beginPath();
        ctx.arc(barHeight + 75, barHeight + 75, 50, 0, Math.PI * 2)
        ctx.moveTo(barHeight + 110, barHeight + 175)
        ctx.arc(barHeight + 75, barHeight + 75, 35, 0, Math.PI)
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(barHeight + 65, barHeight + 65, 5, 0, Math.PI * 2)
        ctx.moveTo(barHeight + 96, barHeight + 56)
        ctx.arc(barHeight + 90, barHeight + 65, 5, 0, Math.PI * 2)
        ctx.fill();


        ctx.restore()
    }

    function drawSaxophone(pathElement, ctx, songData, volume, iterator, bufferL) {
        pathElement.setAttribute('fill', "rgb(" + volume * 300 + "," + volume * 100 + "," + volume * 250 + ")");

        let color = 'hsl(' + iterator * 2.13 + ',80%,50%)';
        ctx.fillStyle = color;

        const barHeight = songData[iterator] * 0.4;
        ctx.save();
        ctx.translate(canvasRef.current.width / 2, canvasRef.current.height / 2)
        ctx.rotate(iterator * Math.PI / bufferL)
        ctx.lineWidth = barHeight / 20;
        ctx.beginPath();
        ctx.arc(0, 1.5 * barHeight, barHeight / 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 1.5 * barHeight, barHeight / 5, 0, Math.PI * 6)
        ctx.restore();

    }


    const handleDragStart = (e) => {
        setDragging(true);
        setDragStartX(e.clientX);
    };

    const handleDrag = (e) => {
        if (!dragging) return;
        const offsetX = e.clientX - dragStartX;
        const newLeft = Math.min(Math.max(overlapDivLeft + offsetX, 100), 700); // Restrict the range between -100 and 100
        setOverlapDivLeft(newLeft);
        setDragStartX(e.clientX);
    };

    const handleDragEnd = () => {
        setDragging(false);
    };

    useEffect(() => {
        if (dragging) {
            window.addEventListener("mousemove", handleDrag);
            window.addEventListener("mouseup", handleDragEnd);
        } else {
            window.removeEventListener("mousemove", handleDrag);
            window.removeEventListener("mouseup", handleDragEnd);
        }

        return () => {
            window.removeEventListener("mousemove", handleDrag);
            window.removeEventListener("mouseup", handleDragEnd);
        };
    }, [dragging]);

    const renderSwitch = (option) => {
        switch (option) {
            case "Guitar":
                setSvg(<Guitar/>);
                break;
            case "Drums":
                setSvg(<Drums/>);
                break;
            case "Saxophone":
                setSvg(<Saxophone/>);
                break;
            case "Keyboard":
                setSvg(<Keyboard/>);
                break;
            default:
                setSvg(<></>);
        }
    }

    return (
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
            <div
                id="overlap"
                className="absolute top-0 rounded-md z-10"
                style={{left: `${overlapDivLeft}px`}} // Use overlapDivLeft to set the left position
                onMouseDown={handleDragStart} // Start dragging when mouse down on the overlap div
            >
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
