import {useEffect, useRef, useState} from "react";
import {FolderPlusIcon, TrashIcon} from "@heroicons/react/24/solid";
import VolumeKnob from "@/components/knobs/volumeKnob";
import PassFilterKnob from "@/components/knobs/passFilterKnob";
import WaveformCanvas from "@/components/waveformCanvas";
import {
    setupAudioSourceNode, setUpConvolverNode,
    setUpHighPassFilterNode, setupLowPassFilterNode,
    setupVolumeNode, startAudio
} from "@/util/AudioNodeUtil";
import {trimAudioBufferToMax} from "@/util/AudioBufferUtil";
import {SpeakerWaveIcon, SpeakerXMarkIcon} from "@heroicons/react/20/solid";


export default function PlayerBar(props) {

    const THISDivRef = useRef(null);
    const [knobSize, setKnobSize] = useState(null); // Use useState to track knobSize
    const waveformCanvasRef = useRef(WaveformCanvas);

    const [isMuted, setIsMuted] = useState(false);
    const [fileSource, setFileSource] = useState(null);

    const audioCtx = useRef(new AudioContext());
    const audioBuffer = useRef(new AudioBuffer({length:1, sampleRate: 44100, numberOfChannels: 1}));
    const audioSource = useRef(null);
    const volumeNode = useRef(null);
    const analyzer = useRef(null);
    const lowPassFilterNode = useRef(null);
    const highPassFilterNode = useRef(null);
    const convolverNode = useRef(null);

    const maxDuration = 2;
    const channel = 0;
    const timeOffSet = useRef(0);

    useEffect(() => {
        setKnobSize(THISDivRef.current ? THISDivRef.current.offsetHeight : null); // Update knobSize when THISDivRef changes
    }, []);

    const handleDelete = () => {
        audioSource.current.stop();
        audioSource.current.disconnect();
        props.deleteHandler();
    };

    const handleMuteSwitch = () => {
        if(!isMuted){
            audioSource.current.disconnect({output: volumeNode.current});
        } else {
            audioSource.current.connect(volumeNode.current);
        }
        setIsMuted(!isMuted);
    }

    const handleSourceFileChange = (files) => {
        let fileBlob = window.URL.createObjectURL(files[0]);
        setFileSource(fileBlob);
        fetch(fileBlob)
            .then(response => response.arrayBuffer())
            .then(buf => audioCtx.current.decodeAudioData(buf))
            .then(audioBuf => {
                audioBuffer.current = audioBuf;
                return trimAudioBufferToMax(audioBuffer.current, maxDuration, channel);
            })
            .then(trimmedChannelData => {
                audioBuffer.current = new AudioBuffer({
                    length: trimmedChannelData.length,
                    sampleRate: audioBuffer.current.sampleRate,
                    numberOfChannels: audioBuffer.current.numberOfChannels});
                audioBuffer.current.copyToChannel(trimmedChannelData, channel);
                waveformCanvasRef.current.drawWaveForm(trimmedChannelData);
            })
            .then(() => {
                setupAndConnectNodes()
                timeOffSet.current = startAudio(props.isPlaying, audioSource.current, audioCtx.current);

            });
    };

    useEffect(() => {
        handlePlayPause(props.isPlaying);
    },[props.isPlaying])

    const handlePlayPause = (shouldPlay) => {
        if(fileSource != null){
            if(shouldPlay){
                if (audioCtx.current.state === "suspended") audioCtx.current.resume();
                else {
                    timeOffSet.current = audioCtx.current.currentTime;
                    audioSource.current.start();
                }
            } else {
                if (audioCtx.current.state === "running") audioCtx.current.suspend();
            }
        }
    }

    const setupAndConnectNodes = () => {
        audioSource.current = setupAudioSourceNode(audioCtx.current, audioBuffer.current);
        volumeNode.current = setupVolumeNode(audioCtx.current);
        analyzer.current = audioCtx.current.createAnalyser();
        lowPassFilterNode.current = setupLowPassFilterNode(audioCtx.current);
        highPassFilterNode.current = setUpHighPassFilterNode(audioCtx.current);
        convolverNode.current = setUpConvolverNode(audioCtx.current);
        audioSource.current
            .connect(volumeNode.current)
            .connect(lowPassFilterNode.current)
            .connect(highPassFilterNode.current)
            .connect(analyzer.current)
            .connect(convolverNode.current)
            .connect(audioCtx.current.destination);
    }

    const changeVolumeValue = (newVolume) => {
        if(volumeNode.current == null) return;
        volumeNode.current.gain.value = newVolume;
    }

    const changeLowPassFrequency = (newFrequency) => {
        if(lowPassFilterNode.current == null) return;
        lowPassFilterNode.current.frequency.value = newFrequency;
    }

    const changeHighPassFrequency = (newFrequency) => {
        if(highPassFilterNode.current == null) return;
        highPassFilterNode.current.frequency.value = newFrequency;
    }

    const getCurrentTime = () => {
        return audioCtx.current.currentTime;
    }

    const getCurrentTimeOffSet = () => {
        return timeOffSet.current;
    }

    const getDuration = () => {
        return audioBuffer.current.duration;
    }

    return (
        <div className="border border-secondary border-2 py-2 rounded-md mb-2 grid grid-cols-9">
            <div className="col-span-1 flex justify-center">
                <div className="flex flex-col gap-4">
                    <label id="import" className="h-auto btn btn-info" htmlFor={`file-input-${props.id}`}>
                        <input id={`file-input-${props.id}`} type="file" style={{ display: "none" }} onChange={(e) => handleSourceFileChange(e.target.files)}/>
                        <FolderPlusIcon className="h-6 w-6" />
                    </label>
                    <button id="delete" className={`h-auto btn ${fileSource ? "btn-error" : "btn-disabled"}`} onClick={handleDelete}>
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
                        <button id="play" className={`h-auto btn ${fileSource ? "btn-info" : "btn-disabled"}`} onClick={handleMuteSwitch}>
                            {isMuted ? <SpeakerXMarkIcon className="h-6 w-6" /> : <SpeakerWaveIcon className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

            </div>
            <div className="col-span-1 flex justify-center">
                <PassFilterKnob knobSize={knobSize || 48} onChangeCallback={changeHighPassFrequency}/>
            </div>
            <div className="col-span-1 flex justify-center">
                <PassFilterKnob knobSize={knobSize || 48} onChangeCallback={changeLowPassFrequency}/>
            </div>
            <div className="col-span-5 flex justify-center flex-col">
                <div className="flex justify-center">
                    <WaveformCanvas isPlaying={props.isPlaying} getCurrentTime={getCurrentTime} getTimeOffSet={getCurrentTimeOffSet} getDuration={getDuration} ref={waveformCanvasRef}/>
                </div>
                <div className="flex justify-center">
                    <PassFilterKnob knobSize={knobSize || 38} text={"Effect"} onChangeCallback={changeHighPassFrequency}/>
                    <PassFilterKnob knobSize={knobSize || 38} text={"Effect"} onChangeCallback={changeHighPassFrequency}/>
                    <PassFilterKnob knobSize={knobSize || 38} text={"Effect"} onChangeCallback={changeHighPassFrequency}/>
                </div>
            </div>
        </div>
    );
}
