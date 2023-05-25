import {useEffect, useRef, useState} from "react";
import TrackComponent from "@/components/track";

let animationController;
export default function PlayerBar(props){

    const [fileSource, setFileSource] = useState(null);
    const audioRef = useRef();
    const canvasRef = useRef();
    const audioSource = useRef();
    const analyzer = useRef();

    useEffect(() => {
        canvasRef.current.style.height = '100%';
        canvasRef.current.height = canvasRef.current.offsetHeight;
    },[])

    const handleSourceFileChange = (files) => {
        setFileSource(window.URL.createObjectURL(files[0]));
    }

    const handlePlayPause = () => {
        if(audioRef.current.paused){
            audioRef.current.play();
        }else{
            audioRef.current.pause();
        }
    }

    const handleAudioPlay = () => {
        let audioContext = new AudioContext();
        if(!audioSource.current){
            audioSource.current = audioContext.createMediaElementSource(audioRef.current);
            analyzer.current = audioContext.createAnalyser();
            audioSource.current.connect(analyzer.current);
            analyzer.current.connect(audioContext.destination);
        }
        visualizeData();
    };

    const handleDelete = () => {

        props.deleteHandler();
    }

    const visualizeData = () => {
        animationController = window.requestAnimationFrame(visualizeData);
        if (audioRef.current === null) return cancelAnimationFrame(animationController);
        if (audioRef.current.paused) return cancelAnimationFrame(animationController);
        const songData = new Uint8Array(100);
        analyzer.current.getByteFrequencyData(songData);
        const bar_width = 3;
        let start = 0;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        for(let i=0; i<songData.length; i++){
            start = i*4;
            let gradient =
                ctx.createLinearGradient(0,0,canvasRef.current.width, canvasRef.current.height);
            gradient.addColorStop(0.2, '#2392f5');
            gradient.addColorStop(0.5, '#fe0095');
            gradient.addColorStop(1.0, '#e500fe');
            ctx.fillStyle = gradient;
            ctx.fillRect(start, canvasRef.current.height, bar_width, -songData[i]/3);
        }
    };

    return(
        <div className="flex bg-info/30 w-max">
            <div className="btn-group bg-cyan-800 rounded-2xl h-14 my-1">
                <canvas className="rounded-l-2xl" ref={canvasRef} width={300}/>
                <label className="btn btn-info h-auto">
                    <input type={"file"}
                           style={{display:'none'}}
                           onChange={(e) => handleSourceFileChange(e.target.files)}
                    />
                    Import
                </label>
                <audio controls style={{display:'none'}} ref={audioRef} onPlay={handleAudioPlay} src={fileSource}/>
                <button className="btn btn-success h-auto" onClick={handlePlayPause}>Play/Pause</button>
                <button className="btn btn-error rounded-r-full h-auto" onClick={handleDelete}>Delete</button>
            </div>
            <TrackComponent/>
        </div>
    );
}
