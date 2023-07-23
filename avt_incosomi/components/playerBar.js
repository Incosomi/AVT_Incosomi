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

    //const audioCtx = useRef(new AudioContext());
    const audioBuffer = useRef(new AudioBuffer({length:1, sampleRate: 44100, numberOfChannels: 1}));
    const audioSource = useRef(null);
    const volumeNode = useRef(null);
    const analyzer = useRef(null);
    const lowPassFilterNode = useRef(null);
    const highPassFilterNode = useRef(null);
    const convolverNode = useRef(null);

    const timeOffSet = useRef(0);

    const startTime = useRef(-1);

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

    const channel = 0;

    const handleSourceFileChange = (files) => {
        props.createAudioCtxHandler();
        let fileBlob = window.URL.createObjectURL(files[0]);
        setFileSource(fileBlob);
        fetch(fileBlob)
            .then(response => response.arrayBuffer())
            .then(buf => props.getAudioCtxHandler().decodeAudioData(buf))
            .then(audioBuf => {
                audioBuffer.current = audioBuf;
                if(props.getMasterDurationHandler() === 0){
                    startTime.current = 0;
                    props.setMasterDurationHandler(audioBuffer.current.duration);
                    return audioBuffer.current.getChannelData(channel);
                }else {
                    return trimAudioBufferToMax(audioBuffer.current, props.getMasterDurationHandler(), channel);
                }
            })
            .then(channelData => {
                audioBuffer.current = new AudioBuffer({
                    length: channelData.length,
                    sampleRate: audioBuffer.current.sampleRate,
                    numberOfChannels: audioBuffer.current.numberOfChannels});
                audioBuffer.current.copyToChannel(channelData, channel);
                waveformCanvasRef.current.drawWaveForm(channelData);
            })
            .then(() => {
                setupAndConnectNodes();
                if(startTime.current < 0)startTime.current = props.getStartTimeHandler();
                timeOffSet.current = startAudio(props.isPlaying, audioSource.current, props.getAudioCtxHandler(), startTime.current);
            });
    };

    useEffect(() => {
        handlePlayPause(props.isPlaying);
    },[props.isPlaying])

    const handlePlayPause = (shouldPlay) => {
        if(fileSource != null){
            if(shouldPlay){
                if (props.getAudioCtxHandler().state === "suspended") props.getAudioCtxHandler().resume();
                else {
                    timeOffSet.current = props.getAudioCtxHandler().currentTime;
                    let startTime = props.getStartTimeHandler();
                    console.log("Starttime playpause: "+startTime);
                    audioSource.current.start(startTime);
                }
            } else {
                if (props.getAudioCtxHandler().state === "running") props.getAudioCtxHandler().suspend();
            }
        }
    }

    const setupAndConnectNodes = () => {
        audioSource.current = setupAudioSourceNode(props.getAudioCtxHandler(), audioBuffer.current);
        volumeNode.current = setupVolumeNode(props.getAudioCtxHandler());
        analyzer.current = props.getAudioCtxHandler().createAnalyser();
        lowPassFilterNode.current = setupLowPassFilterNode(props.getAudioCtxHandler());
        highPassFilterNode.current = setUpHighPassFilterNode(props.getAudioCtxHandler());
        convolverNode.current = setUpConvolverNode(props.getAudioCtxHandler());
        audioSource.current
            .connect(volumeNode.current)
            .connect(lowPassFilterNode.current)
            .connect(highPassFilterNode.current)
            .connect(analyzer.current)
            .connect(convolverNode.current)
            .connect(props.getAudioCtxHandler().destination);
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
        return props.getAudioCtxHandler().currentTime;
    }

    const getCurrentTimeOffSet = () => {
        return props.getMasterTimeOffsetHandler();
    }

    const getAudioBufferDuration = () => {
        return audioBuffer.current.duration;
    }

    const shouldDrawCursor = () => {
        return startTime.current <= props.getAudioCtxHandler().currentTime;
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
                    <VolumeKnob knobSize={knobSize || 48} onChangeCallback={changeVolumeValue}/>
                    <div>
                        <button id="play"
                                className={`h-auto btn ${fileSource ? "btn-info" : "btn-disabled"}`}
                                onClick={handleMuteSwitch}>
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
                    <WaveformCanvas isPlaying={props.isPlaying}
                                    shouldDrawCursor={shouldDrawCursor}
                                    getCurrentTime={getCurrentTime}
                                    getTimeOffSet={getCurrentTimeOffSet}
                                    getMaxDuration={getAudioBufferDuration}
                                    ref={waveformCanvasRef}/>
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
