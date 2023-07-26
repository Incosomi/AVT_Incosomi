import {useEffect, useRef, useState} from "react";
import {FolderPlusIcon, TrashIcon} from "@heroicons/react/24/solid";
import VolumeKnob from "@/components/knobs/volumeKnob";
import PassFilterKnob from "@/components/knobs/passFilterKnob";
import WaveformCanvas from "@/components/waveformCanvas";
import {
    setupAudioSourceNode, setupConvolverNode,
    setupHighShelfFilterNode, setupLowShelfFilterNode, setupPeakingFilterNode,
    setupVolumeNode, startAudio
} from "@/util/AudioNodeUtil";
import {trimAudioBufferToMax} from "@/util/AudioBufferUtil";
import {SpeakerWaveIcon, SpeakerXMarkIcon} from "@heroicons/react/20/solid";
import EqualizerCanvas from "@/components/equalizerCanvas";
import {StageCanvas} from "@/components/stage/stageCanvas";

export default function PlayerBar(props) {

    const waveformCanvasRef = useRef(WaveformCanvas);

    const [isMuted, setIsMuted] = useState(false);
    const [fileSource, setFileSource] = useState(null);

    const audioBuffer = useRef(null);
    const audioSource = useRef(null);
    const volumeNode = useRef(null);
    const analyzer = useRef(null);
    const lowShelfFilterNode = useRef(null);
    const peakingFilterNode = useRef(null);
    const highShelfFilterNode = useRef(null);
    const convolverNode = useRef(null);

    const timeOffSet = useRef(0);

    const startTime = useRef(-1);

    const selectedOption = useRef("");

    const handleDelete = () => {
        audioSource.current.loop = false;
        audioSource.current.disconnect();
        props.deleteHandler();
    };

    const handleMuteSwitch = () => {
        if (!isMuted) {
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
                if (props.getMasterDurationHandler() === 0) {
                    startTime.current = 0;
                    props.setMasterDurationHandler(audioBuffer.current.duration);
                    return audioBuffer.current.getChannelData(channel);
                } else {
                    return trimAudioBufferToMax(audioBuffer.current, props.getMasterDurationHandler(), channel);
                }
            })
            .then(channelData => {
                audioBuffer.current = new AudioBuffer({
                    length: channelData.length,
                    sampleRate: audioBuffer.current.sampleRate,
                    numberOfChannels: audioBuffer.current.numberOfChannels
                });
                audioBuffer.current.copyToChannel(channelData, channel);
                waveformCanvasRef.current.drawWaveForm(channelData);
            })
            .then(() => {
                setupAndConnectNodes();
                if (startTime.current < 0) startTime.current = props.getStartTimeHandler();
                timeOffSet.current = startAudio(props.isPlaying, audioSource.current, props.getAudioCtxHandler(), startTime.current);
            })
            .then(() => {
                props.addPlayerBarHandler();
            });
    };

    useEffect(() => {
        handlePlayPause(props.isPlaying);
    }, [props.isPlaying])

    const handlePlayPause = (shouldPlay) => {
        if (fileSource != null) {
            if (shouldPlay) {
                if (props.getAudioCtxHandler().state === "suspended") props.getAudioCtxHandler().resume();
                else {
                    timeOffSet.current = props.getAudioCtxHandler().currentTime;
                    audioSource.current.start(startTime.current);
                }
            } else {
                if (props.getAudioCtxHandler().state === "running") props.getAudioCtxHandler().suspend();
            }
        }
    }

    const lowShelf_Frequency = 2500;
    const highShelf_Frequency = 10000;

    const setupAndConnectNodes = () => {
        audioSource.current = setupAudioSourceNode(props.getAudioCtxHandler(), audioBuffer.current);
        volumeNode.current = setupVolumeNode(props.getAudioCtxHandler());
        analyzer.current = props.getAudioCtxHandler().createAnalyser();
        lowShelfFilterNode.current = setupLowShelfFilterNode(props.getAudioCtxHandler(), lowShelf_Frequency);
        highShelfFilterNode.current = setupHighShelfFilterNode(props.getAudioCtxHandler(), highShelf_Frequency);
        peakingFilterNode.current = setupPeakingFilterNode(props.getAudioCtxHandler(), lowShelf_Frequency, highShelf_Frequency);
        convolverNode.current = setupConvolverNode(props.getAudioCtxHandler());
        audioSource.current
            .connect(volumeNode.current)
            .connect(lowShelfFilterNode.current)
            .connect(peakingFilterNode.current)
            .connect(highShelfFilterNode.current)
            .connect(analyzer.current)
            .connect(convolverNode.current)
            .connect(props.getAudioCtxHandler().destination);
    }

    const changeVolumeValue = (newVolume) => {
        if (volumeNode.current == null) return;
        volumeNode.current.gain.value = newVolume;
    }

    const changeLowPassFrequency = (newFrequency) => {
        if (lowShelfFilterNode.current == null) return;
        lowShelfFilterNode.current.frequency.value = newFrequency;
    }

    const changeHighShelfFrequency = (newFrequency) => {
        if (highShelfFilterNode.current == null) return;
        highShelfFilterNode.current.frequency.value = newFrequency;
    }


    const getLowShelfFrequency = () => {
        return lowShelfFilterNode.current.frequency.value;
    }
    const getLowShelfGain = () => {
        return lowShelfFilterNode.current.gain.value;
    }

    const setLowShelfGain = (newGain) => {
        if (lowShelfFilterNode.current == null) return;
        if (newGain > 40) return;
        if (newGain < -40) return;
        lowShelfFilterNode.current.gain.value = newGain;
    }

    const getPeakingFrequency = () => {
        return peakingFilterNode.current.frequency.value;
    }

    const getPeakingGain = () => {
        return peakingFilterNode.current.gain.value;
    }

    const setPeakingGain = (newGain) => {
        if (peakingFilterNode.current == null) return;
        if (newGain > 40) return;
        if (newGain < -40) return;
        peakingFilterNode.current.gain.value = newGain;
    }

    const getHighShelfFrequency = () => {
        return highShelfFilterNode.current.frequency.value;
    }

    const getHighShelfGain = () => {
        return highShelfFilterNode.current.gain.value;
    }

    const setHighShelfGain = (newGain) => {
        if (highShelfFilterNode.current == null) return;
        if (newGain > 40) return;
        if (newGain < -40) return;
        highShelfFilterNode.current.gain.value = newGain;
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

    const getAnalyzerNode = () => {
        return analyzer.current;
    }

    const getByteFrequencyData = (songData) => {
        analyzer.current.getByteFrequencyData(songData);
    }

    const handleSelectedOptionChange = (event) => {
        selectedOption.current  = event.target.value;
    };

    const getSelectedOption = () => {
        return selectedOption.current;
    }

    return (
        <div className="grid grid-cols-3">
            <div className="col-span-2 border border-secondary py-2 rounded-md mb-2 grid grid-cols-10">
                <div className="flex justify-center">
                    <div className="flex flex-col gap-4">
                        <label id="import" className="h-auto btn btn-info" htmlFor={`file-input-${props.id}`}>
                            <input id={`file-input-${props.id}`} type="file" style={{display: "none"}}
                                   onChange={(e) => handleSourceFileChange(e.target.files)}/>
                            <FolderPlusIcon className="h-6 w-6"/>
                        </label>
                        <button id="delete" className={`h-auto btn ${fileSource ? "btn-error" : "btn-disabled"}`}
                                onClick={handleDelete}>
                            <TrashIcon className="h-6 w-6"/>
                        </button>
                    </div>
                </div>
                <div className="justify-center ">
                    <div className="flex flex-col gap-4 items-center">
                        <VolumeKnob knobSize={48} onChangeCallback={changeVolumeValue}/>
                        <div>
                            <button id="play"
                                    className={`h-auto btn ${fileSource ? "btn-info" : "btn-disabled"}`}
                                    onClick={handleMuteSwitch}>
                                {isMuted ? <SpeakerXMarkIcon className="h-6 w-6"/> :
                                    <SpeakerWaveIcon className="h-6 w-6"/>}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center">
                    <PassFilterKnob knobSize={48} onChangeCallback={changeHighShelfFrequency}/>
                </div>
                <div className="flex justify-center">
                    <PassFilterKnob knobSize={48} onChangeCallback={changeLowPassFrequency}/>
                </div>
                <div className="col-span-4 flex justify-center flex-col gap-4">
                    <div className="flex justify-center">
                        <WaveformCanvas isPlaying={props.isPlaying}
                                        shouldDrawCursor={shouldDrawCursor}
                                        getCurrentTime={getCurrentTime}
                                        getTimeOffSet={getCurrentTimeOffSet}
                                        getMaxDuration={getAudioBufferDuration}
                                        ref={waveformCanvasRef}/>
                    </div>
                    <div className="flex justify-center">
                        <EqualizerCanvas getAnalyzer={getAnalyzerNode}
                                         getFrameFrequencyData={getByteFrequencyData}
                                         getLowFrequency={getLowShelfFrequency} getLowGain={getLowShelfGain}
                                         setLowGain={setLowShelfGain}
                                         getPeakingFrequency={getPeakingFrequency} getPeakingGain={getPeakingGain}
                                         setPeakingGain={setPeakingGain}
                                         getHighFrequency={getHighShelfFrequency} getHighGain={getHighShelfGain}
                                         setHighGain={setHighShelfGain}/>
                    </div>
                </div>
                <div className="col-span-1 flex flex-col justify-center ">
                    <select className="select select-secondary" onChange={handleSelectedOptionChange}>
                        <option selected={true} value="">None</option>
                        <option value="Guitar">Guitar</option>
                        <option value="Drums">Drums</option>
                        <option value="Saxophone">Saxophone</option>
                        <option value="Keyboard">Keyboard</option>
                    </select>
                </div>
            </div>
            <StageCanvas getAnalyzer={getAnalyzerNode} getSelectedOption={getSelectedOption}/>
        </div>

    );
}
