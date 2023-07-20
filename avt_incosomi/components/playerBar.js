import { useEffect, useRef, useState } from "react";
import {
    FolderPlusIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    TrashIcon
} from "@heroicons/react/24/solid";
import VolumeKnob from "@/components/knobs/volumeKnob";
import PassFilterKnob from "@/components/knobs/passFilterKnob";

let animationController;

export default function PlayerBar(props) {
    const [fileSource, setFileSource] = useState(null);
    const audioRef = useRef();

    const audioSource = useRef();
    const volumeNode = useRef();
    const analyzer = useRef();
    const lowPassFilterNode = useRef();
    const highPassFilterNode = useRef();
    const convolverNode = useRef();

    const canvasRef = useRef();

    const THISDivRef = useRef(null);
    const [knobSize, setKnobSize] = useState(null); // Use useState to track knobSize

    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        canvasRef.current.style.height = "100%";
        canvasRef.current.height = canvasRef.current.offsetHeight;

        setKnobSize(THISDivRef.current ? THISDivRef.current.offsetHeight : null); // Update knobSize when THISDivRef changes
    }, []);

    const handleDelete = () => {
        props.deleteHandler();
    };

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
        let audioCtx = new AudioContext();
        if (!audioSource.current) {
            createNodes(audioCtx);

            setUpVolumeNode();

            setUpLowPassFilterNode();

            setUpHighPassFilterNode();

            connectNodes(audioCtx);
        }
        visualizeData();
    };

    const createNodes = (audioContext) => {
        audioSource.current = audioContext.createMediaElementSource(audioRef.current);
        volumeNode.current = audioContext.createGain();
        analyzer.current = audioContext.createAnalyser();
        lowPassFilterNode.current = audioContext.createBiquadFilter();
        highPassFilterNode.current = audioContext.createBiquadFilter();
        let impulse = calcImpulseResponse(1, 2, audioContext);
        convolverNode.current = new ConvolverNode(audioContext, {buffer:impulse});
    }

    const calcImpulseResponse = (duration, decay, audioCtx) => {
        let length = audioCtx.sampleRate * duration;
        let impulse = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
        let IR = impulse.getChannelData(0);
        for(let i=0; i<length; i++)IR[i] = (2*Math.random()-1)*Math.pow(1-i/length, decay);
        return impulse;
    }

    const setUpVolumeNode = () => {
        volumeNode.current.gain.value = 1;
    }

    const changeVolumeValue = (newVolume) => {
        if(volumeNode.current == null) return;
        volumeNode.current.gain.value = newVolume;
    }

    const setUpLowPassFilterNode = () => {
        lowPassFilterNode.current.type = "lowpass";
        lowPassFilterNode.current.frequency.value = 5000;
    }

    const changeLowPassFrequency = (newFrequency) => {
        if(lowPassFilterNode.current == null) return;
        lowPassFilterNode.current.frequency.value = newFrequency;
    }

    const setUpHighPassFilterNode = () => {
        highPassFilterNode.current.type = "highpass";
        highPassFilterNode.current.frequency.value = 5000;
    }

    const changeHighPassFrequency = (newFrequency) => {
        if(highPassFilterNode.current == null) return;
        highPassFilterNode.current.frequency.value = newFrequency;
    }

    const connectNodes = (audioContext) => {
        audioSource.current
            .connect(volumeNode.current)
            .connect(lowPassFilterNode.current)
            .connect(highPassFilterNode.current)
            .connect(analyzer.current)
            .connect(convolverNode.current)
            .connect(audioContext.destination);
    }



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
        <div className="border border-slate-600 py-2 rounded-md mb-2 grid grid-cols-9">
            <div className="col-span-1 flex justify-center">
                <div className="flex flex-col gap-4">
                    <label
                        id="import"
                        className="h-auto btn btn-info"
                        htmlFor={`file-input-${props.id}`}
                    >
                        <input
                            id={`file-input-${props.id}`}
                            type="file"
                            style={{ display: "none" }}
                            onChange={(e) => handleSourceFileChange(e.target.files)}
                        />
                        <FolderPlusIcon className="h-6 w-6" />
                    </label>
                    <button
                        id="delete"
                        className={`h-auto btn ${fileSource ? "btn-error" : "btn-disabled"}`}
                        onClick={handleDelete}
                    >
                        <TrashIcon className="h-6 w-6" />
                    </button>

                </div>

            </div>
            <div className="col-span-1 justify-center ">
                <div className="flex flex-col gap-4 items-center">
                    <VolumeKnob
                        knobSize={knobSize || 48}
                        onChangeCallback={changeVolumeValue}
                    />
                    <div>
                        <audio
                            controls
                            style={{ display: "none" }}
                            ref={audioRef}
                            onPlay={handleAudioPlay}
                            src={fileSource}
                            onEnded={() => setIsPlaying(false)}
                        />
                        <button
                            id="play"
                            className={`h-auto btn ${fileSource ? "btn-info" : "btn-disabled"}`}
                            onClick={handlePlayPause}
                        >
                            {isPlaying ? <SpeakerXMarkIcon className="h-6 w-6" /> : <SpeakerWaveIcon className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

            </div>
            <div className="col-span-1 flex justify-center">
                <PassFilterKnob
                    knobSize={knobSize || 48}
                    onChangeCallback={changeHighPassFrequency}
                />
            </div>
            <div className="col-span-1 flex justify-center">
                <PassFilterKnob
                    knobSize={knobSize || 48}
                    onChangeCallback={changeLowPassFrequency}
                />
            </div>
            <div className="col-span-5 flex justify-center flex-col">
                <div className="flex justify-center">
                    <canvas
                        id="waveform"
                        className="rounded-l-2xl"
                        ref={canvasRef}
                        width={300}
                        height={53}
                    />

                </div>
                <div className="flex justify-center">
                    <PassFilterKnob
                        knobSize={knobSize || 38}
                        text={"Effect"}
                        onChangeCallback={changeHighPassFrequency}
                    />
                    <PassFilterKnob
                        knobSize={knobSize || 38}
                        text={"Effect"}
                        onChangeCallback={changeHighPassFrequency}
                    />
                    <PassFilterKnob
                        knobSize={knobSize || 38}
                        text={"Effect"}
                        onChangeCallback={changeHighPassFrequency}
                    />

                </div>

            </div>

        </div>
    );
}
