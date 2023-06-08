import { useEffect, useRef, useState } from "react";
import FreqKnobsComponent from "@/components/freqKnobs";
import { FolderPlusIcon, PauseIcon, PlayIcon, TrashIcon } from "@heroicons/react/24/solid";
import KnobComponent from "@/components/knob";

let animationController;

export default function PlayerBar(props) {
    const [fileSource, setFileSource] = useState(null);
    const audioRef = useRef();
    const canvasRef = useRef();
    const audioSource = useRef();
    const analyzer = useRef();

    const THISDivRef = useRef(null);
    const [knobSize, setKnobSize] = useState(null); // Use useState to track knobSize

    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        canvasRef.current.style.height = "100%";
        canvasRef.current.height = canvasRef.current.offsetHeight;

        setKnobSize(THISDivRef.current ? THISDivRef.current.offsetHeight : null); // Update knobSize when THISDivRef changes
    }, []);

    const handleSourceFileChange = (files) => {
        setFileSource(window.URL.createObjectURL(files[0]));
    };

    const handlePlayPause = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleAudioPlay = () => {
        let audioContext = new AudioContext();
        if (!audioSource.current) {
            audioSource.current = audioContext.createMediaElementSource(audioRef.current);
            analyzer.current = audioContext.createAnalyser();
            audioSource.current.connect(analyzer.current);
            analyzer.current.connect(audioContext.destination);
        }
        visualizeData();
    };

    const handleDelete = () => {
        props.deleteHandler();
    };

    const visualizeData = () => {
        animationController = window.requestAnimationFrame(visualizeData);
        if (audioRef.current === null) return cancelAnimationFrame(animationController);
        if (audioRef.current.paused) return cancelAnimationFrame(animationController);
        const songData = new Uint8Array(100);
        analyzer.current.getByteFrequencyData(songData);
        const bar_width = 3;
        let start = 0;
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        for (let i = 0; i < songData.length; i++) {
            start = i * 4;
            let gradient = ctx.createLinearGradient(0, 0, canvasRef.current.width, canvasRef.current.height);
            gradient.addColorStop(0.2, "#2392f5");
            gradient.addColorStop(0.5, "#fe0095");
            gradient.addColorStop(1.0, "#e500fe");
            ctx.fillStyle = gradient;
            ctx.fillRect(start, canvasRef.current.height, bar_width, -songData[i] / 3);
        }
    };

    return (
        <tr id="THISDivRef" className="bg-info/30">
            <td>
                <canvas id="waveform" className="rounded-l-2xl border-r border-slate-600" ref={canvasRef} width={300} height={53} />
            </td>
            <td>
                <label id="import" className="h-auto btn btn-info">
                    <input
                        type="file"
                        style={{ display: "none" }}
                        onChange={(e) => handleSourceFileChange(e.target.files)}
                    />
                    <FolderPlusIcon className="h-6 w-6" />
                </label>
            </td>
            <td>
                <audio controls style={{ display: "none" }} ref={audioRef} onPlay={handleAudioPlay} src={fileSource} />
                <button id="play" className={`h-auto btn ${fileSource ? "btn-success" : "btn-disabled"}`} onClick={handlePlayPause} disabled={fileSource}>
                    {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                </button>
            </td>
            <td>
                <button id="delete" className={`h-auto btn ${fileSource ? "btn-error" : "btn-disabled"}`} onClick={handleDelete}>
                    <TrashIcon className="h-6 w-6" />
                </button>
            </td>
            <td className="border-l border-slate-600">
                <KnobComponent id="high" knobSize={48} text="TREBBLE" />
            </td>
            <td>
                <KnobComponent id="mid" knobSize={48} text="MID" />
            </td>
            <td className="border-r border-slate-600">
                <KnobComponent id="low" knobSize={48} text="BASS" />
            </td>
            <td className="border-r border-slate-600">
                <KnobComponent id="vol" knobSize={48} text="VOL" />
            </td>
        </tr>
    );
}
