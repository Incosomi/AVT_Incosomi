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
import Guitar from "@/components/svg/guitar";
import Drums from "@/components/svg/drums";
import Saxophone from "@/components/svg/saxophone";
import Keyboard from "@/components/svg/keyboard";

let animationController;

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

    const playerCanvas = useRef();

    const [selectedOption, setSelectedOption] = useState('');

    const handleChange = (event) => {
        setSelectedOption(event.target.value);
    };

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
        console.log("Playerbar TimeOffSet: " + props.getMasterTimeOffsetHandler());
        console.log("Current Time: " + props.getAudioCtxHandler().currentTime);
    };

    useEffect(() => {
        handlePlayPause(props.isPlaying);
        drawBandPlayer();
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

    //TODO: refactor
    function getVolumeSamples() {
        const songData = new Uint8Array(128);
        analyzer.current.getByteFrequencyData(songData);


        let normalSamples = [...songData].map(e => e / 128 - 1);
        let sum = 0;
        for (let i = 0; i < normalSamples.length; i++) {
// convert values between 1 and -1 to positive
            sum += normalSamples[i] * normalSamples[i];
        }
        let volume = Math.sqrt(sum / normalSamples.length)
        return volume;
    }

    const drawBandPlayer = () => {

        if (!props.isPlaying) return;
        if (!analyzer.current) return;

        // animationController = window.requestAnimationFrame(drawBandPlayer);
        //if (audioRef.current === null) return cancelAnimationFrame(animationController);
        //if (audioRef.current.paused) return cancelAnimationFrame(animationController);
        console.log("i am in Band Player")
        const songData = new Uint8Array(128);
        analyzer.current.getByteFrequencyData(songData);

        const volume = getVolumeSamples();
        let softVolume = 0;
        softVolume = softVolume * 0.7 + volume * 0.3;
        //--------------
        const bufferL = analyzer.current.frequencyBinCount / 2;

        const ctx = playerCanvas.current.getContext("2d");
        ctx.clearRect(0, 0, playerCanvas.current.width, playerCanvas.current.height);

        let x;
        let barWidth = 8;
        let barHeight;
        let selectedSVG;
        for (let i = 0; i < bufferL; i++) {
            //------------
            switch (selectedOption) {

                case "Guitar":
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
                case "Saxophone":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'translate(-50%, -50%) scale(' + (1 + softVolume), (softVolume + 1) + ')'
                    break
            }

            //-----------------
        }
        ;
        requestAnimationFrame(drawBandPlayer);
    };

    return (
        <div className="relative">
            <div className="border border-secondary border-2 py-2 rounded-md mb-2 grid grid-cols-9">
                <div className="col-span-1 flex justify-center">
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
                <div className="col-span-1 justify-center ">
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
                <div className="col-span-1 flex justify-center">
                    <PassFilterKnob knobSize={48} onChangeCallback={changeHighShelfFrequency}/>
                </div>
                <div className="col-span-1 flex justify-center">
                    <PassFilterKnob knobSize={48} onChangeCallback={changeLowPassFrequency}/>
                </div>
                <div className="col-span-5 flex justify-center flex-col gap-4">
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
            </div>
            <div>
                <select value={selectedOption} onChange={handleChange}>
                    <option value="">I donot want character, bitch</option>
                    <option value="Guitar"> Guitar</option>
                    <option value="Drums"> Drums</option>
                    <option value="Saxophone"> Saxophone</option>
                    <option value="Keyboard"> Keyboard</option>
                </select>
                <p>Selected Option: {selectedOption}</p>
            </div>
            <div id="overlap"
                 className="absolute top-1/2 right-[-50%] transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-md z-10">

                <div className="w-40 h-40">
                    <canvas id="stage"
                            className="rounded-l-2xl absolute top-0 left-0 w-full h-full"
                            ref={playerCanvas} style={{
                        color: 'orange'
                    }}>
                    </canvas>
                    {(() => {
                        switch (selectedOption) {
                            case "Guitar":
                                return <Guitar/>;
                                break;
                            case "Drums":
                                return <Drums/>;
                                break;
                            case "Saxophone":
                                return <Saxophone/>;
                                break;
                            case "Keyboard":
                                return <Keyboard/>;
                                break;

                        }
                    })()}
                </div>
            </div>
        </div>

    );
}
