import { useEffect, useRef, useState } from "react";
import { FolderPlusIcon, PauseIcon, PlayIcon, TrashIcon } from "@heroicons/react/24/solid";
import VolumeKnob from "@/components/knobs/volumeKnob";
import PassFilterKnob from "@/components/knobs/passFilterKnob";


let animationController;
let animationController2;

export default function PlayerBar(props) {
    const [fileSource, setFileSource] = useState(null);
    const audioRef = useRef();

    const audioSource = useRef();
    const volumeNode = useRef();
    const analyzer = useRef();
    const bandVisualizer = useRef();
    const lowPassFilterNode = useRef();
    const highPassFilterNode = useRef();
    const convolverNode = useRef();

    const canvasRef = useRef();
    const roomCanvas = useRef();



    const v = new Path2D("M37.76 14.39C42.18 12.75 46.6 11.11 51.02 9.48C52.54 12.15 54.06 14.82 55.59 17.49C55.7 17.68 55.81 17.9 55.76 18.11C55.71 18.33 55.5 18.47 55.31 18.59C52.82 20.18 50.27 21.79 47.4 22.5C44.99 23.1 42.27 23.09 40.36 24.68C40.2 24.81 40.04 24.96 39.83 24.98C39.48 25.02 39.21 24.67 39.03 24.37C37.42 21.67 36.32 18.66 35.82 15.55C35.77 15.25 36.69 15.71 36.79 15.88C37.07 16.4 36.5 16.99 35.97 16.61C34.74 15.73 37.22 14.6 37.77 14.4L37.76 14.39Z");


    const [selectedOption, setSelectedOption] = useState('');

    const handleChange = (event) => {
        setSelectedOption(event.target.value);
    };
    // let imageSVG = new Image();
    // useEffect(()=>{
    //     console.log("some one changed to " + selectedOption)
    //     imageSVG.src = "/Figuren/"+selectedOption+".svg"
    //
    //     if (roomCanvas.current!=null){
    //         console.log("my canvas is not null");
    //         const ctx = roomCanvas.current.getContext("2d");
    //         ctx.clearRect(0,0, roomCanvas.current.width, roomCanvas.current.height);
    //         ctx.drawImage(imageSVG, 0, 0 );
    //     }
    // },[selectedOption])



    const THISDivRef = useRef(null);
    const [knobSize, setKnobSize] = useState(null); // Use useState to track knobSize

    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        canvasRef.current.style.height = "100%";
        canvasRef.current.height = canvasRef.current.offsetHeight;

        roomCanvas.current.style.height = "100%";
        roomCanvas.current.height = canvasRef.current.offsetHeight;

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
           drawBandPlayer();
    };

    const createNodes = (audioContext) => {
        audioSource.current = audioContext.createMediaElementSource(audioRef.current);
        volumeNode.current = audioContext.createGain();
        analyzer.current = audioContext.createAnalyser();
        // connecting the visualizer for the band

        bandVisualizer.current = audioContext.createAnalyser()
        bandVisualizer.current.fftSize = 512;

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

    const getSamples =(songData) =>{
        analyser.current.getByteTimeDomainData();
        let normalSamples = [...songData].map(e => e/128-1);
        return normalSamples;
    }

    const getVolumeSamples = ()=>{
        const songData = new Uint8Array(128);
        analyzer.current.getByteFrequencyData(songData);



        let normalSamples = [...songData].map(e => e/128-1);
        let sum = 0;
        for (let i = 0;  i<normalSamples.length; i++ ){
// convert values between 1 and -1 to positive
            sum+=normalSamples[i]* normalSamples[i] ;
        }
        let volume =Math.sqrt(sum/normalSamples.length)
        return volume ;
    }

    const drawBandPlayer = () =>{

        // animationController = window.requestAnimationFrame(drawBandPlayer);
        if (audioRef.current === null) return cancelAnimationFrame(animationController);
        if (audioRef.current.paused) return cancelAnimationFrame(animationController);
        console.log("i am in Band Player")
        const songData = new Uint8Array(128);
        analyzer.current.getByteFrequencyData(songData);

        const volume = getVolumeSamples();
        let softVolume=0;
        softVolume = softVolume * 0.7 + volume * 0.3 ;
        //--------------
        const bufferL =  analyzer.current.frequencyBinCount/2 ;

        const ctx = roomCanvas.current.getContext("2d");
        ctx.clearRect(0, 0, roomCanvas.current.width, roomCanvas.current.height);

        let x ;
        let barWidth = 8;
        let barHeight ;
        let selectedSVG ;
        for (let i = 0; i < bufferL; i++) {
            //------------
            switch (selectedOption){

                case "Gittare":
                     selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'translate(-50%, -50%) scale(' +(1+softVolume ),(softVolume +1) +  ')'
                    // Get the SVG element


// Get the path element inside the SVG
                    const pathElement = selectedSVG.querySelector('path');

// Change the fill color
                    pathElement.setAttribute('fill', "'#FFFFFF';"); // Change to white (#00FF00)
                    console.log(softVolume)
                    // pathElement.setAttribute('fill', "rgb("+ softVolume*250+","+ volume*250cc+","+volume*255+")"); // Change to green (#00FF00)
                    break
                case "Drums":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'translate(-50%, -50%) scale(' +(1+softVolume ),
                    (softVolume +1) +  ')'
                    break
                case "Keyboard":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'translate(-50%, -50%) scale(' +(1+softVolume ),
                    (softVolume +1) +  ')'
                    break
                case "Saxaphone":
                    selectedSVG = document.getElementById(selectedOption);
                    selectedSVG.style.transform = 'translate(-50%, -50%) scale(' +(1+softVolume ),
                    (softVolume +1) +  ')'
                    break
            }

          //-----------------
        };
        requestAnimationFrame(drawBandPlayer);
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
                <audio controls style={{ display: "none" }} ref={audioRef} onPlay={handleAudioPlay} src={fileSource} onEnded={() => setIsPlaying(false)}/>
                <button id="play" className={`h-auto btn ${fileSource ? "btn-success" : "btn-disabled"}`} onClick={handlePlayPause} >
                    {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                </button>
            </td>
            <td>
                <button id="delete" className={`h-auto btn ${fileSource ? "btn-error" : "btn-disabled"}`} onClick={handleDelete}>
                    <TrashIcon className="h-6 w-6" />
                </button>
            </td>
            <td className="border-l border-slate-600">
                <PassFilterKnob knobSize={48} onChangeCallback={changeHighPassFrequency}/>
            </td>
            <td>
            </td>
            <td className="border-r border-slate-600">
                <PassFilterKnob knobSize={48} onChangeCallback={changeLowPassFrequency}/>
            </td>
            <td className="border-r border-slate-600">
                <VolumeKnob knobSize={48} onChangeCallback={changeVolumeValue} />
            </td>
            <td className="border-r border-slate-600">
                <select value={selectedOption} onChange={handleChange}>
                    <option value="">I donot want character, bitch  </option>
                    <option value="Gittare"> Gittare </option>
                    <option value="Drums"> Drums </option>
                    <option value="Saxaphone"> Saxaphone </option>
                    <option value="Keyboard"> Keyboard </option>
                </select>
                <p>Selected Option: {selectedOption}</p>
            </td>
            <td>
                <canvas id="stage" className="rounded-l-2xl border-r border-slate-600  " ref={roomCanvas}   style={{
                    color: 'orange'
                }} >
                {/*switch case for choose different characters*/}

                    {(() => {
                        switch (selectedOption) {
                            case "Keyboard":  return  <svg id="Keyboard" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" width="100" height="200" viewBox="0 0 100 100" fill="Animatable" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M37.76 14.39C42.18 12.75 46.6 11.11 51.02 9.48C52.54 12.15 54.06 14.82 55.59 17.49C55.7 17.68 55.81 17.9 55.76 18.11C55.71 18.33 55.5 18.47 55.31 18.59C52.82 20.18 50.27 21.79 47.4 22.5C44.99 23.1 42.27 23.09 40.36 24.68C40.2 24.81 40.04 24.96 39.83 24.98C39.48 25.02 39.21 24.67 39.03 24.37C37.42 21.67 36.32 18.66 35.82 15.55C35.77 15.25 36.69 15.71 36.79 15.88C37.07 16.4 36.5 16.99 35.97 16.61C34.74 15.73 37.22 14.6 37.77 14.4L37.76 14.39Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M42.52 20.75C42.78 21.13 43.11 21.54 43.56 21.57C43.81 21.59 44.06 21.48 44.29 21.37C45.88 20.64 47.46 19.92 49.05 19.19C49.56 18.96 50.11 18.68 50.35 18.17C50.6 17.63 50.43 16.99 50.2 16.44C49.85 15.58 49.36 14.78 48.77 14.07C48.66 13.94 48.54 13.81 48.38 13.77C48.24 13.74 48.09 13.79 47.96 13.84C46.67 14.32 45.49 15.11 44.14 15.42C42.89 15.71 40.83 15.51 40.09 16.74C41.07 17.73 41.67 19.54 42.5 20.74L42.52 20.75Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14.29 24.37C15.67 24 17.04 23.63 18.42 23.26C24.14 21.72 29.94 20.16 35.09 17.22" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M28 23.93C28.22 23.44 27.87 22.85 27.39 22.62C26.91 22.39 26.34 22.42 25.81 22.47C23.45 22.66 21.06 22.98 18.88 23.9C18.2 24.19 17.52 24.55 17.12 25.16C16.72 25.77 16.68 26.68 17.22 27.18" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M19.99 27.19L20.06 25.51C20.07 25.21 20.09 24.9 20.22 24.63C20.59 23.88 21.62 23.81 22.44 23.93C23.41 24.08 24.45 24.41 24.97 25.24C25.16 25.54 25.27 25.89 25.28 26.24" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M21.47 27.04C21.25 26.3 21.59 25.38 22.31 25.09C23.03 24.8 23.99 25.37 23.95 26.15" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M31.03 20.07C30.41 20.12 29.92 20.64 29.67 21.21C29.42 21.78 29.35 22.41 29.16 23C28.41 25.37 25.94 26.84 23.48 27.24C21.02 27.64 18.52 27.18 16.05 26.93" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M52.35 9.34999C58.81 5.69999 65.91 3.18999 73.23 1.98999C73.52 1.93999 73.82 1.89999 74.09 1.98999C74.41 2.08999 74.66 2.34999 74.89 2.59999C76.42 4.24999 77.94 5.89999 79.47 7.54999C77.2 7.63999 75.27 9.13999 73.21 10.07C72.18 10.54 71.09 10.86 70 11.19C65.12 12.66 60.23 14.14 55.35 15.61" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M75.08 5.25999C70.14 2.90999 63.91 3.55999 59.57 6.89999C57.41 8.55999 55.74 10.78 54.11 12.97" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M57.14 13.51C57.19 11.28 58.22 9.09 59.89 7.62C60.72 6.89 61.7 6.33 62.66 5.79C63.17 5.5 63.69 5.21 64.25 5.02C65.53 4.58 66.94 4.72 68.22 5.15C69.5 5.58 70.65 6.31 71.77 7.07" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M68.27 9.16999C68.08 8.60999 67.58 8.20999 67.03 7.99999C66.48 7.78999 65.88 7.75999 65.3 7.73999C65.06 7.73999 64.82 7.73999 64.59 7.80999C64.37 7.88999 64.18 8.04999 64.01 8.20999C62.88 9.29999 62.25 10.88 62.3 12.45C62.43 12.34 62.55 12.23 62.68 12.12" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M64.56 11.34C64.56 10.82 64.61 10.27 64.92 9.86C65.23 9.45 65.91 9.28 66.27 9.65C66.55 9.94 66.62 10.49 67.01 10.54" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M76.19 6.11999C75.02 5.86999 73.8 6.25999 72.77 6.87999C71.74 7.49999 70.88 8.32999 69.95 9.08999C65.41 12.79 59.3 14.5 53.49 13.71C53.69 13.73 53.9 13.74 54.1 13.76" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M31.91 26.99C33.03 26.78 34.13 26.5 35.22 26.16" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M33.82 28.61L35.97 28.03" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M27.78 29.05C28.27 28.67 28.85 28.42 29.47 28.33" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M28.96 30.53C29.63 30.42 30.28 30.18 30.86 29.83" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M25.76 32.9L27.19 32.26C27.33 32.2 27.46 31.95 27.3 31.94" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M24.49 30.42C25.15 30.44 25.82 30.22 26.35 29.81" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M20.91 31.65C21.56 31.68 22.21 31.58 22.81 31.36" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M21.17 34.31C21.95 34.41 22.76 34.29 23.48 33.96" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M62.79 15.69L64.56 15.14" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M66.48 14.11C67.15 13.87 67.84 13.67 68.54 13.53" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M70.58 13.13C71.4 12.92 72.22 12.68 73.02 12.41" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M74.14 11.19C75.01 10.91 75.91 10.74 76.83 10.68" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M63.93 17.32C64.53 17.01 65.19 16.8 65.86 16.71" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M68.92 15.43L72.13 14.73" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M74.48 13.58C75.01 13.06 75.71 12.72 76.45 12.62" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M58.31 16.32L58.47 17.97C58.47 17.97 58.48 18.07 58.51 18.11C58.55 18.16 58.61 18.17 58.67 18.17C59.25 18.21 59.76 17.72 59.93 17.16C60.1 16.6 60.02 16 59.93 15.43" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14.53 33.56C13.91 33.62 13.3 33.84 12.79 34.21C12.49 34.43 12.21 34.71 12.07 35.05C11.81 35.68 12.07 36.44 12.58 36.88C13.09 37.32 13.83 37.44 14.49 37.3C15.48 37.09 16.35 36.19 16.31 35.17C16.27 34.15 15.1 33.29 14.18 33.72C13.95 33.83 13.78 34.19 14.01 34.28" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M18.7 48.73C19.14 47.46 19.41 46.13 19.48 44.79C19.51 44.25 19.51 43.69 19.32 43.18C19.13 42.67 18.72 42.22 18.19 42.11C15.04 41.48 18.95 48 18.7 48.73Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M21.66 48.2C22.07 48.39 22.57 48.15 22.82 47.77C23.07 47.39 23.1 46.92 23.11 46.47C23.12 45.37 22.96 44.24 22.46 43.26C21.88 42.12 20.02 40.19 20.15 42.43C20.27 44.29 21.15 46.4 21.66 48.19V48.2Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M79.58 8.82999L83.14 15.09C83.74 16.14 84.34 17.2 85.08 18.16C85.82 19.13 86.7 20 87.43 20.98C88.6 22.53 89.39 24.34 90.06 26.16C90.22 26.59 90.37 27.07 90.19 27.49C90.01 27.91 89.54 28.13 89.12 28.31C85.32 29.92 81.53 31.54 77.73 33.15" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M77.88 36.64C81.65 35.65 85.38 34.51 89.06 33.23C89.39 33.11 89.73 32.99 90 32.77C90.49 32.36 90.65 31.66 90.59 31.03C90.53 30.4 90.28 29.8 90.07 29.19C90.04 29.11 90.02 29.02 90.07 28.96C90.12 28.9 90.26 28.98 90.2 29.04" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M45.97 46.12C55.17 43.82 63.37 38.68 72.06 34.87" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M52.41 47.34C58.94 45.5 65.26 42.93 71.22 39.69" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M38.8 49.17C34.5 50.91 30.2 52.66 25.9 54.4C24.51 54.97 23.11 55.53 21.8 56.27C20.36 57.08 18.99 58.12 17.36 58.39C14.27 50.56 11.14 42.53 10.97 34.11C11.01 34.44 11.06 34.77 11.1 35.09" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M16.96 62.41C17.36 61.35 17.58 60.22 17.6 59.09" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M29.98 14.07C27.7 14.02 25.65 15.38 23.78 16.68C19.82 19.43 15.82 22.21 12.56 25.76C7.37 31.41 4.27 38.92 3.97 46.59C3.45 44.64 3.06 42.66 2.8 40.67C2.51 38.47 2.38 36.25 2.25 34.03C2.18 32.84 2.11 31.63 2.34 30.45C2.54 29.42 2.95 28.45 3.41 27.52C4.23 25.86 5.22 24.29 6.36 22.83C6.46 22.7 6.59 22.56 6.75 22.57C6.91 22.58 6.99 22.86 6.83 22.89" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M38.53 9.94C32.35 9.84 25.84 9.82 20.44 12.83C16.3 15.13 13.21 19.02 9.03 21.25C6.58 22.56 3.6 23.45 2.31 25.91C2.42 24.01 3.77 22.45 5.05 21.04C9.61 16.03 14.41 10.85 20.74 8.42" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M11.92 12.65L10.45 13.6C11.82 11.98 13.53 10.68 15.23 9.39999C17.7 7.53999 20.24 5.63999 23.2 4.73999C26.27 3.80999 29.56 4.01999 32.74 4.35999C35.11 4.60999 37.54 4.94999 39.64 6.06999" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M15.42 7.93999C12.97 7.54999 10.41 7.94999 8.2 9.07999C8.32 8.17999 8.99 7.46999 9.67 6.87999C12.94 3.98999 17.1 2.10999 21.43 1.55999C23.95 1.23999 26.5 1.35999 29.03 1.40999C33.11 1.48999 37.19 1.37999 41.26 1.07999C43.04 0.949993 44.81 0.789993 46.59 0.789993C48.39 0.789993 50.19 0.979993 51.99 1.16999C57.2 1.69999 62.42 2.23999 67.63 2.76999" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M9.35 31.11L10.52 33.22C10.6 33.37 10.7 33.53 10.87 33.58C11.05 33.63 11.23 33.53 11.39 33.44C19.33 28.62 28.87 27.18 37.17 23.03" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M34.62 16C32.24 17 29.86 18.01 27.48 19.01C23.68 20.61 19.84 22.22 15.8 23.04" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M11.6 27.19C13.26 26.57 15.09 26.4 16.84 26.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M6.7 37.84C8.76 41.05 10.48 44.49 11.82 48.07" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14.06 55.82L15.4 58.26C16.19 59.71 17.01 61.28 16.83 62.92" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M17.99 61.88C25.87 57.68 34.29 54.61 42.69 51.55" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M36.13 47.18C32.64 48.09 28.96 49.11 26.45 51.71C26.45 48.4 25.15 45.29 23.65 42.4C22.97 41.09 21.78 40.03 22.83 38.8C23.75 37.71 25.62 37.11 26.84 36.42L33.79 32.49C37.04 30.65 40.3 28.81 43.75 27.37C47.54 25.8 51.51 24.73 55.35 23.28C60.57 21.31 65.52 18.64 70.84 16.96C73.92 15.98 77.17 15.31 79.85 13.51C79.04 14.05 86.41 26.32 87.06 27.72C86.43 27.95 85.73 27.7 85.06 27.67C83.97 27.63 82.89 28.27 82.39 29.24" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M24.09 38.86C28.89 38.01 33 35.03 37.06 32.33C43.56 28 50.58 24.11 58.27 22.77C60.34 22.41 62.48 22.23 64.38 21.33C69.07 19.11 73.96 17.32 78.98 15.98C79.08 15.95 79.18 15.93 79.28 15.9" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M25.85 39.9C26.97 42.42 27.91 45.01 28.66 47.66C28.1 47.95 27.54 48.21 26.96 48.45" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M29.02 46.6C29.11 46.84 29.21 47.09 29.42 47.22C29.76 47.44 30.25 47.22 30.43 46.85C30.61 46.48 30.52 46.04 30.33 45.68C30.14 45.32 29.88 45.01 29.66 44.67C29.38 44.24 29.18 43.76 28.98 43.28C28.64 42.46 28.35 41.48 27.84 40.79C26.43 41.49 28.62 45.47 29.03 46.59L29.02 46.6Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M28.06 37.86C27.9 37.92 27.95 38.16 28.02 38.32C28.8 39.91 29.58 41.51 30.36 43.1C30.32 42.94 30.28 42.78 30.24 42.62" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M29.42 37.28L31.23 40.84" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M31.38 36.36C31.6 37.22 32.02 38.03 32.62 38.7" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M33.13 35.35L33.76 37.14" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M35.88 33.8C36.25 34.92 36.74 36.01 37.35 37.02" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M37.58 32.82C38.89 35.55 40.28 38.24 41.75 40.89" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M39.1 31.93C40.18 33.88 41.18 35.87 42.09 37.9" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M41.11 30.14C42.3 33.93 44.92 37.2 45.8 41.08C45.24 41.13 44.69 41.35 44.26 41.7" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M44.23 32.97C44.64 33.88 45.06 34.78 45.47 35.69C45.57 35.91 45.75 36.16 45.98 36.1C46.21 36.04 46.23 35.72 46.19 35.49C45.86 33.25 44.91 31.11 43.47 29.36C42.97 28.75 42.9 30.62 42.97 30.84C43.18 31.51 43.91 32.28 44.22 32.97H44.23Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M47.64 35.08L48.28 35.03C48.44 35.02 48.64 34.97 48.68 34.82C48.7 34.74 48.68 34.66 48.64 34.59C48.3 33.7 46.97 28.86 46.01 29.37C44.88 29.98 47.42 35.11 47.64 35.09V35.08Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M46.94 36.01C46.76 36.01 46.78 36.28 46.86 36.44C48.31 39.42 49.25 39.7 52.43 38.52C52.37 37.73 52.15 36.97 51.9 36.22C51.12 33.86 50.1 31.57 48.87 29.41C48.56 28.87 48.23 28.3 48.2 27.68" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M52.86 31.57C52.89 32 52.71 32.48 52.32 32.67C52.17 32.74 51.98 32.76 51.85 32.66C51.77 32.6 51.72 32.49 51.68 32.4C51.16 31.17 50.64 29.93 50.13 28.7C49.88 28.1 48.62 25.92 50.28 26.26C51.15 26.44 52.82 30.82 52.87 31.57H52.86Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M53.37 38.32C53.51 38.55 53.81 38.25 53.99 38.05C54.59 37.35 56.04 37.66 56.33 36.79C56.43 36.47 56.31 36.13 56.2 35.82L54.77 32.07C54.3 30.83 53.28 29.12 52.98 27.84C53.54 27.75 54.11 27.64 54.67 27.62C55.09 28.92 55.27 30.31 55.78 31.58C56.43 33.21 57.34 34.67 57.83 36.38L59.72 35.06C59.88 34.95 60.03 34.84 60.15 34.69C60.58 34.12 60.21 33.32 59.84 32.71C58.81 31.03 57.77 29.34 56.74 27.66C56.65 27.51 56.52 27.35 56.35 27.38C55.95 27.46 56.38 28.23 56.04 28.45" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M52.06 27.22C53.22 27.21 54.31 26.72 55.36 26.25C59.18 24.52 63 22.8 66.82 21.07" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M60.85 29.09C61.51 30.48 62.06 31.93 62.49 33.41C62.93 33.42 63.01 32.74 63.39 32.53C63.57 32.43 63.79 32.45 63.98 32.36C64.45 32.12 64.29 31.41 64.05 30.93C63.62 30.07 63.19 29.21 62.77 28.35C62.2 28.59 61.63 28.82 61.06 29.06C60.98 29.09 60.89 29.14 60.87 29.22C60.85 29.3 60.99 29.38 61.02 29.3" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M61 25.51C61.37 26.44 61.86 27.32 62.45 28.13C62.94 28.26 63.35 27.65 63.28 27.15C63.21 26.65 62.85 26.24 62.58 25.82C62.29 25.36 61.9 24.77 61.38 24.93C61 25.05 60.88 25.51 60.81 25.89" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M64.35 28.02C64.3 27.89 64.26 27.74 64.31 27.61C64.38 27.46 64.56 27.4 64.73 27.36C65.38 27.2 66.03 27.04 66.68 26.88C66.77 26.86 66.87 26.84 66.96 26.87C67.04 26.9 67.1 26.97 67.16 27.04C68.3 28.48 69.7 30.76 67.08 31.22C65.07 31.57 64.91 29.58 64.36 28.03L64.35 28.02Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M64.56 23.53C64.99 24.63 65.44 25.72 65.9 26.81C66.01 26.47 66.46 26.43 66.81 26.42C67.16 26.41 67.62 26.27 67.61 25.91C67.61 25.75 67.49 25.61 67.39 25.48C66.81 24.81 66.24 24.14 65.66 23.47C65.52 23.31 65.36 23.14 65.15 23.13C64.94 23.12 64.75 23.42 64.91 23.55" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M68.66 20.66C68.48 20.61 68.47 20.93 68.56 21.09C69 21.85 69.45 22.6 69.89 23.36" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M70.96 19.77C71.27 20.5 71.53 21.23 71.86 21.95C71.94 22.11 72.29 23.28 72.24 22.7" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M73.12 19.26C73.47 20.23 73.88 21.18 74.36 22.09" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M74.99 18.78L78.05 23.25" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M77.54 18.52C78.48 20.27 79.54 21.95 80.71 23.56" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M79.46 17.09C79.52 17.69 79.78 18.26 80.04 18.81C81.19 21.25 82.34 23.7 83.49 26.14" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M43.08 43.92C52.18 39.67 61.5 35.89 70.98 32.6" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M66.35 32.02L66.23 33.61C67.08 33.37 67.9 33.07 68.69 32.69C69.64 32.24 68.92 31.9 68.37 31.74C67.82 31.58 66.71 32.01 66.16 32.16C64.82 32.51 63.48 33.03 62.35 33.85C62.3 34.13 62.01 34.89 62.09 35.15C62.85 34.89 63.59 34.56 64.29 34.15C64.99 33.74 66.57 32.79 66.36 32.01L66.35 32.02Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M31.05 46.22C31.78 45.85 32.61 45.67 33.42 45.7C33.33 46.23 33.66 46.81 34.16 47C33.02 47.56 31.85 48.04 30.65 48.45C30.63 47.91 30.61 47.37 30.59 46.84C30.59 46.67 30.59 46.49 30.67 46.35C30.75 46.21 30.97 46.12 31.1 46.23" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M46.46 40.07C47.02 39.51 47.78 39.14 48.57 39.06C48.81 39.62 48.95 40.22 49.01 40.83C48.06 41.03 47.14 41.31 46.24 41.68C46.17 41.31 46.09 40.93 46.16 40.56C46.23 40.19 46.44 39.82 46.8 39.69" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M62.88 50.98C66.02 47.7 71.29 46.97 74.06 43.37C75.12 41.99 75.71 40.31 76.19 38.64C76.68 36.92 77.06 35.17 77.34 33.41C77.45 32.74 77.54 32.06 77.83 31.45C78.41 30.23 79.65 29.48 80.51 28.44C81.46 27.29 81.93 25.76 81.78 24.27C81.76 24.06 81.72 23.83 81.57 23.69C81.2 23.33 80.6 23.72 80.26 24.1C79.67 24.77 79.14 25.49 78.68 26.25C77.52 24.83 75.94 23.76 74.19 23.23C73.72 23.82 74.23 24.68 74.78 25.21C75.33 25.74 75.99 26.39 75.78 27.12C75.07 25.6 73.79 24.35 72.26 23.66C71.67 23.98 71.86 24.87 72.13 25.49C72.81 27.03 73.49 28.56 74.16 30.1C72.4 29.3 73.03 26.38 71.58 25.11C70.77 24.4 69.58 24.42 68.51 24.49C68.34 24.49 68.16 24.51 68.02 24.6C67.68 24.81 67.69 25.34 67.93 25.66C68.17 25.98 68.56 26.15 68.91 26.33C70.62 27.22 71.94 28.82 72.5 30.66C71.24 29.95 70.22 28.83 69.6 27.52C69.36 27.01 68.93 26.35 68.41 26.57C67.97 27.46 68.41 28.52 68.92 29.38C70.33 31.82 72.25 34.18 72.34 36.99C72.44 40.25 69.98 43.08 67.18 44.75C64.38 46.42 61.18 47.3 58.31 48.85C58.16 48.93 57.96 49.01 57.84 48.89C57.72 48.77 58.01 48.56 58.02 48.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M58.33 62.09C58.33 61.56 57.71 61.2 57.18 61.28C56.65 61.36 56.22 61.72 55.81 62.06C54.3 63.31 52.67 64.42 50.94 65.36C49.12 66.35 47.1 67.18 45.04 66.98C41.82 66.67 39.38 64 36.41 62.71C34.89 62.05 33.17 61.75 31.56 62.14C29.5 62.64 27.87 64.17 26.27 65.56C23.2 68.24 19.88 70.61 16.56 72.98C15.61 73.66 14.64 74.34 13.52 74.65C12.26 74.99 10.91 74.82 9.67 74.44C7.67 73.83 5.67 72.47 5.22 70.42C4.71 68.1 6.3 65.91 7.26 63.74C8.29 61.4 8.61 58.8 9.63 56.46C10.08 55.43 10.61 54.29 11.21 53.34L13.86 49.14C14.77 50.52 15.01 52.32 14.49 53.88C13.94 55.53 12.65 56.83 11.91 58.4C11.16 59.99 11.01 61.79 10.92 63.55C10.85 65 10.82 66.5 11.34 67.86C11.86 69.22 13.08 70.4 14.54 70.46C15.73 70.5 16.84 69.79 17.64 68.91C18.44 68.03 19.02 66.96 19.73 66C21.47 63.67 24.01 62.02 26.75 61.02C29.49 60.02 32.41 59.65 35.31 59.54C36.6 59.49 37.9 59.49 39.15 59.79C40.26 60.05 41.3 60.53 42.34 61.01C43.44 61.52 44.54 62.03 45.65 62.53C46.5 62.92 47.39 63.32 48.32 63.32C50.14 63.31 51.56 61.81 52.78 60.46C54 59.11 55.52 57.67 57.33 57.83C59.02 57.98 60.25 59.45 61.2 60.85C61.26 60.93 61.31 61.05 61.25 61.12C61.19 61.19 61.05 61.04 61.14 61.02" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M62.72 65.59L63.07 68.27" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M57.82 72.51C56.88 73.12 56.64 74.45 55.73 75.1C54.99 75.63 54 75.6 53.09 75.55C51.07 75.43 49.05 75.31 47.03 75.19C44.52 75.04 41.97 74.89 39.56 74.15C38.25 73.75 36.78 72.87 36.79 71.5C36.79 70.35 37.86 69.51 38.87 68.96C39.88 68.41 41.03 67.9 41.52 66.86" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M62.12 73.87C61.32 75.87 59.28 77.14 57.18 77.62C55.08 78.1 52.9 77.91 50.75 77.79C46.4 77.55 42.03 77.59 37.68 77.9C36.54 77.98 35.26 78.04 34.41 77.28C33.89 76.81 33.64 76.11 33.48 75.42C32.48 70.96 35.02 65.97 39.22 64.17" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M42.79 60.28L45.45 57.74C45.97 57.25 46.48 56.75 47.07 56.35C47.73 55.9 48.46 55.57 49.14 55.17C50.38 54.44 51.46 53.48 52.53 52.52" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M45.47 61.84C47.58 60.29 49.77 58.85 52.03 57.52C52.9 57.01 53.78 56.52 54.66 56.03C55.8 55.39 56.93 54.76 58.07 54.12" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M88.33 21.12C89.43 21.2 90.51 21.46 91.52 21.88C91.68 21.95 91.84 22.02 91.95 22.16C92.16 22.42 92.09 22.79 92.03 23.12C91.69 25.06 92.07 27.04 92.27 29C92.83 34.6 91.83 40.23 90.84 45.77C90.22 49.24 89.6 52.7 88.98 56.17C88.52 58.71 88.06 61.29 86.99 63.64C85.92 65.99 84.15 68.13 81.76 69.11C79.58 70 77.13 69.85 74.78 69.68C71.6 69.46 68.42 69.23 65.25 69.01C63.89 68.91 62.49 68.81 61.3 68.16C60.44 67.69 59.67 66.77 59.88 65.81C60.14 64.64 61.59 64.25 62.78 64.11C64.27 63.93 65.76 63.8 67.26 63.7" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M77.27 68.94C73.49 63.4 69.21 58.2 64.49 53.44C63.55 52.49 62.58 51.55 61.42 50.9C60.12 50.18 58.64 49.85 57.19 49.55C52.6 48.6 47.88 47.78 43.77 45.54C43.21 45.23 42.6 44.81 42.52 44.18C42.46 43.75 42.67 43.33 42.87 42.95C43.21 42.3 43.55 41.65 43.89 40.99C44.39 40.03 44.76 38.6 43.81 38.08C43.13 37.71 42.25 38.22 41.9 38.91C41.55 39.6 41.56 40.41 41.47 41.18C41.45 41.36 41.42 41.56 41.29 41.69C40.9 42.11 40.25 41.53 40.02 41C39.62 40.05 39.38 39.02 38.89 38.11C38.4 37.2 37.56 36.38 36.52 36.29C35.48 36.2 34.39 37.15 34.62 38.16C34.71 38.56 34.97 38.89 35.23 39.2C36.06 40.22 36.88 41.23 37.71 42.25C36.96 42.55 36.34 41.65 35.85 41C34.95 39.82 33.42 39.16 31.95 39.33C32.25 39.69 32.58 40.03 32.91 40.38C34.25 41.81 35.47 43.36 36.54 45.01C35.05 43.48 33.25 41.91 31.12 41.98C30.9 41.98 30.67 42.02 30.49 42.15C29.89 42.59 30.45 43.54 31.04 43.99C34.97 47.01 40.24 47.8 44.23 50.72C44.93 51.23 45.61 51.81 46.44 52.04C47.12 52.22 47.83 52.15 48.53 52.1C52.27 51.86 56.07 52.53 59.51 54.01C60.67 54.51 61.8 55.11 62.75 55.94C63.54 56.63 64.2 57.47 64.84 58.31C67.38 61.66 69.73 65.16 71.86 68.79" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M75.58 76.02C77.12 78.31 79.67 79.89 82.4 80.25C85.13 80.61 88.01 79.74 90.08 77.92C91.57 76.62 92.63 74.88 93.39 73.06C94.31 70.88 94.85 68.5 94.65 66.15C94.45 63.8 93.48 61.46 91.74 59.86" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M80.76 74.8C81.45 75.84 82.35 76.93 83.59 77.07C84.25 77.15 84.91 76.93 85.53 76.67C86.56 76.23 87.53 75.63 88.26 74.79C88.99 73.95 89.44 72.83 89.34 71.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M72.77 62.62C74.93 61.99 77.21 62.04 79.46 62.09C81.9 62.15 84.35 62.21 86.79 62.27" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M70.84 59.53C76.38 58.84 82.01 58.8 87.56 59.42" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M65.52 60.54C62.01 61.23 58.59 62.42 55.41 64.07C54.45 64.57 53.41 65.24 53.23 66.3C53.13 66.88 53.31 67.47 53.56 68.01C55.17 71.46 59.27 72.87 62.97 73.77C65.5 74.38 68.06 74.92 70.63 75.37C71.55 75.53 72.5 75.69 73.43 75.58C74.4 75.47 75.32 75.08 76.26 74.8C78.45 74.15 80.78 74.11 83.02 73.66C85.26 73.21 87.57 72.21 88.74 70.24C89.44 69.07 89.66 67.69 89.87 66.34C90.18 64.34 90.49 62.34 90.8 60.34C91.09 58.44 91.39 56.53 91.68 54.63C93.02 45.94 94.37 37.22 94.51 28.42C94.55 25.56 94.42 22.54 92.87 20.14C91.05 17.32 87.31 15.91 84.08 16.82" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M51.31 95.53C53.27 95.86 55.3 96.2 57.22 95.68C57.89 95.5 58.54 95.22 59.2 95.01C60.1 94.72 61.04 94.55 61.98 94.38C64.09 94 66.35 93.64 68.32 94.48" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M81.96 36.14C83.44 40.31 82.73 44.96 81.26 49.14C80.45 51.45 79.41 53.69 78.12 55.78C77.5 56.78 76.83 57.74 76.25 58.76C76.32 58.53 76.38 58.3 76.45 58.07" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M86.41 34.96C86.58 42.89 85.53 50.86 83.29 58.47" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M81.61 62.76C80.67 64.85 79.86 67 79.19 69.19" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M75.5 62.64C75.08 63.56 74.88 64.58 74.92 65.6" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M71.92 76.44C69.65 79.99 67.66 83.72 65.96 87.57C66.84 88.27 67.93 88.69 69.05 88.74C70.06 84.04 72.32 79.61 75.54 76.03" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M59.14 93.4C57.27 92.69 50.55 91.02 49.96 94.03C49.85 94.61 50.05 96.93 50.33 97.28C51.16 98.33 54.51 98.61 55.71 98.45C56.92 98.29 58.03 97.72 59.2 97.37C61.64 96.64 64.26 96.89 66.81 96.94C69.35 96.99 71.33 92.93 69.96 90.74C69.03 89.24 67.09 88.8 65.35 88.5C64.88 89.06 64.56 89.75 64.43 90.47L59.83 90.55C60.73 91.63 62.11 92.3 63.52 92.33C62.58 92.52 61.68 91.93 60.85 91.44C60.02 90.95 58.95 90.54 58.15 91.06C57.91 91.22 57.72 91.44 57.5 91.62C56.9 92.11 56.05 92.26 55.32 92" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M9.41 44.68C6.76 50.23 4.04 56.06 4.31 62.21C4.33 62.78 4.39 63.38 4.68 63.87C4.97 64.36 5.54 64.74 6.1 64.62" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12.26 59.74L15.78 60.68C16.02 60.75 16.27 60.81 16.51 60.9" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M11.72 66.39C13.28 66.76 14.95 66.69 16.47 66.18C17.2 65.94 18.13 65.65 18.61 66.25" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M20.14 61.48C21.19 61.25 22.34 61.64 23.03 62.47" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M22.63 69.22C23.56 70.36 24.15 71.78 24.3 73.25C24.43 74.51 24.24 75.78 24.05 77.04C23.31 81.96 22.58 86.88 21.84 91.81C22.71 89.86 24.79 88.52 26.92 88.53C27.46 83.73 27.64 78.89 27.81 74.07C27.87 72.5 27.92 70.92 27.75 69.35C27.62 68.17 27.28 66.87 26.27 66.24" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M21.4 93.04L21.13 95.08C21.09 95.35 21.07 95.67 21.27 95.86C21.42 96.01 21.66 96.03 21.87 96.04C27.18 96.2 32.68 93.72 37.65 95.6C38.95 96.09 40.54 96.83 41.59 95.92C42.48 95.15 43.29 92.93 44.91 93.36C46.83 93.87 45.04 95.75 44.14 96.31C43.47 96.73 42.8 97.14 42.13 97.56C41.52 97.94 40.91 98.32 40.24 98.57C36.02 100.17 31.5 96.4 27.02 96.93C25.56 97.1 24.19 97.73 22.86 98.38C22.69 98.46 22.5 98.55 22.31 98.52C21.55 98.4 21.52 96.73 20.83 97.06" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M26.72 89.11C26.43 89.79 26.97 90.68 27.71 90.73C28.02 90.75 28.33 90.66 28.62 90.56C29.36 90.31 30.1 90.07 30.85 89.82" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M28.36 93.31C28.89 91.88 30.14 90.86 31.34 89.91C31.75 89.59 32.17 89.26 32.68 89.14C33.06 89.05 33.46 89.09 33.85 89.14C34.69 89.23 35.52 89.32 36.36 89.41" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M33.6 92.46C34.27 91.69 35.01 90.97 35.82 90.34C36.19 90.05 36.58 89.77 37.01 89.59C37.81 89.26 38.7 89.29 39.56 89.33C41.08 89.39 42.66 89.46 44.03 90.12C45.04 90.61 45.99 91.67 45.66 92.75C45.62 92.55 45.58 92.35 45.54 92.15" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>; break;

                            case "Saxaphone": return  <svg id="Saxaphone" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24.42 23.71C23.96 22.7 23.58 21.64 23.29 20.57C22.74 18.58 22.52 16.32 23.63 14.58C24.93 12.53 27.72 11.75 28.86 9.61C29.2 8.97 29.39 8.2 29.96 7.75" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M26.82 22.08C26.18 20.8 25.74 19.37 25.84 17.94C25.94 16.51 26.66 15.08 27.89 14.35C28.29 14.12 28.72 13.96 29.11 13.71C30.66 12.7 30.9 10.55 31.94 9.02C31.94 9.18 31.82 9.33 31.67 9.34" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M33.06 9.25C33.18 9.3 33.3 9.36 33.43 9.35C33.61 9.33 33.74 9.2 33.86 9.07C34.05 8.87 34.24 8.67 34.43 8.46C34.58 8.3 34.73 8.14 34.8 7.94C34.91 7.61 34.78 7.26 34.62 6.95C34.12 5.96 33.32 5.12 32.37 4.56C32.23 4.48 32.07 4.4 31.91 4.44C31.8 4.47 31.71 4.55 31.62 4.62C30.89 5.31 30.05 6.1 30.43 7.13C30.81 8.16 32.12 8.8 33.06 9.25Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M38.31 1.17C38.09 1.52 37.89 1.89 37.72 2.26C37.53 2.67 37.38 3.08 37.22 3.5C37.08 3.88 36.93 4.26 36.79 4.64C36.48 5.47 36.16 6.3 35.7 7.06C35.65 7.14 35.58 7.24 35.48 7.24C34.98 7.28 34.75 5.71 34.43 5.38C33.89 4.84 33.16 5.05 33.28 4.1C33.5 2.31 36.62 3.08 36.57 1.52C37.13 1.36 37.73 1.27 38.31 1.17Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M26.51 19.29C29.1 19.15 31.71 19.01 34.29 19.34C34.56 19.37 34.88 19.44 35 19.69C35.24 20.17 34.55 20.56 34.02 20.67C31.4 21.17 28.82 21.84 26.28 22.66C24.33 23.29 22.31 24.08 21.05 25.7C20.6 26.28 20.27 26.95 19.77 27.49C19.34 27.96 18.79 28.32 18.37 28.81C17.46 29.86 17.28 31.48 17.94 32.7" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M19.99 35.59C20.86 35.51 21.7 35.22 22.42 34.73C21.75 33.3 21.43 31.71 21.49 30.13C21.5 29.83 21.53 29.53 21.67 29.27C21.8 29.05 22 28.88 22.21 28.72C24.98 26.59 28.21 25.13 31.39 23.69C32.1 23.37 32.82 23.04 33.56 22.78C34.85 22.33 36.2 22.07 37.45 21.54C38.7 21.01 39.9 20.14 40.41 18.88C40.52 18.61 40.59 18.31 40.56 18.02C40.45 17.24 39.6 16.81 38.85 16.57C37.26 16.05 35.56 15.72 33.9 15.98C32.67 16.17 31.51 16.67 30.3 16.95C29.14 17.22 27.93 17.29 26.74 17.15" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M14.63 34.06C13.04 35.1 11.5 36.24 10.09 37.52C7.84 39.55 5.91 41.92 4 44.28C3.8 44.53 3.58 44.84 3.68 45.14C3.77 45.43 4.1 45.56 4.4 45.62C6.19 45.97 7.89 44.85 9.62 44.28C12.86 43.21 16.39 44.07 19.69 44.94" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M19.41 41.2C17.53 40.86 15.6 41.26 13.72 41.61C13.05 41.74 12.34 41.85 11.7 41.61C11.06 41.37 10.56 40.63 10.82 40C11.02 39.51 11.57 39.28 12.07 39.1C12.89 38.81 13.73 38.53 14.43 38.01C15.29 37.36 15.87 36.36 16.83 35.87C16.78 36.04 16.72 36.21 16.67 36.37" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M22.21 40.6C23.53 40.29 24.62 39.34 25.39 38.23C26.16 37.12 26.64 35.83 27.1 34.57C27.63 33.13 28.16 31.66 28.17 30.13C28.17 29.54 28.13 28.87 28.55 28.45C29.08 27.93 30.04 28.21 30.47 28.81C30.9 29.41 30.96 30.2 30.99 30.93C31.08 32.79 31.16 34.74 30.38 36.44C31.93 35.41 33.62 34.6 35.39 34.03C36.58 33.65 37.95 33.4 39.05 34C39.34 34.16 39.61 34.39 39.7 34.71C39.75 34.9 39.73 35.1 39.69 35.29C39.33 36.76 37.53 37.36 36.01 37.32C34.49 37.28 32.92 36.88 31.5 37.4C31.66 37.98 32.45 38.02 33.05 37.96C35.56 37.67 38.1 37.58 40.63 37.68C41.09 37.7 41.6 37.74 41.92 38.08C42.28 38.46 42.24 39.1 41.95 39.54C41.66 39.98 41.17 40.25 40.68 40.44C39.4 40.95 37.97 41.06 36.63 40.76C35.22 40.44 33.82 39.68 32.42 40.05C32.57 40.64 33.28 40.87 33.89 40.93C34.71 41.01 35.56 40.95 36.32 41.24C37.08 41.53 37.76 42.33 37.55 43.12C37.36 43.84 36.52 44.22 35.78 44.17C35.04 44.12 34.35 43.78 33.66 43.51C31.86 42.8 29.86 42.58 27.95 42.87C28.35 43.47 29.24 43.29 29.94 43.2C32.11 42.93 34.37 44.32 35.1 46.39C35.18 46.61 35.24 46.86 35.15 47.08C35.06 47.3 34.85 47.44 34.64 47.53C33.36 48.12 31.68 47.62 30.94 46.42" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M25.24 26.25C25.87 27.94 26.67 29.56 27.63 31.09C27.66 30.96 27.63 30.82 27.55 30.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M29.89 25.14L34.69 33.52" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M38.02 50.63C36.66 50.15 35.3 49.67 33.94 49.19C30.25 47.88 26.37 46.41 23.92 43.35C23.16 42.4 22.57 41.34 21.97 40.29C19.83 36.55 17.48 32.91 14.74 29.58C13.91 28.57 13.04 27.59 12.27 26.53C11.22 25.09 10.36 23.52 9.74 21.86C9.5 21.22 9.36 20.36 9.92 19.97C10.1 19.85 10.31 19.8 10.52 19.76C14.63 18.92 18.89 18.75 23.05 19.26C22.88 19.16 22.71 19.07 22.54 18.97" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M22.67 16.64L12.99 16.43C12.18 16.41 11.33 16.4 10.58 16.72C9.46 17.2 8.76 18.32 8.15 19.37C7.56 20.37 6.97 21.41 6.83 22.56C6.68 23.86 7.12 25.15 7.65 26.35C8.46 28.18 9.5 29.97 11.09 31.19C12.16 32.01 13.43 32.54 14.47 33.39C15.37 34.13 16.06 35.09 16.68 36.08C18.2 38.51 19.33 41.17 20.82 43.61C22.31 46.05 24.26 48.35 26.86 49.55C30.41 51.18 34.96 50.67 37.83 53.32" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M60.67 37.73C57.9 41.04 54.02 43.4 49.8 44.32C49.12 44.47 48.42 44.59 47.81 44.93C47.34 45.19 46.87 45.59 46.35 45.49C45.75 45.37 45.48 44.7 45.22 44.15C44.8 43.26 44.12 42.46 43.22 42.05C42.32 41.64 41.19 41.68 40.42 42.29C40.29 42.39 40.16 42.52 40.09 42.67C39.78 43.33 40.58 43.96 41.27 44.2C41.96 44.44 42.82 44.81 42.79 45.54C42.78 45.93 42.49 46.24 42.21 46.51C41.21 47.43 40 48.12 39.15 49.18C38.3 50.24 37.88 51.85 38.71 52.92C39.02 53.33 39.6 53.62 40.05 53.37C40.29 53.24 40.43 52.99 40.57 52.75C41.1 51.81 41.63 50.87 42.16 49.93C42.55 49.24 43.02 48.48 43.79 48.3C43.94 49.17 43.33 49.98 42.76 50.65C41.55 52.07 40.24 53.85 40.81 55.62C40.99 56.17 41.37 56.68 41.91 56.87C42.79 57.18 43.77 56.55 44.21 55.73C44.65 54.91 44.71 53.95 44.85 53.02C44.99 52.09 45.26 51.12 45.97 50.53C45.29 52.82 44.74 55.15 44.33 57.5C44.22 58.14 44.12 58.81 44.29 59.44C44.46 60.07 45 60.65 45.66 60.66C46.6 60.67 47.16 59.63 47.41 58.73C47.85 57.16 48.05 55.52 48.4 53.92C48.67 52.68 49.04 51.46 49.42 50.25C49.71 49.31 50.04 48.3 50.82 47.7C51.5 47.19 52.38 47.07 53.21 46.88C54.92 46.48 56.53 45.67 57.86 44.53C58.75 43.77 59.52 42.86 60.43 42.12C61.61 41.16 62.99 40.48 64.36 39.82" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M64.46 34.35C70.98 30.4 77.68 26.29 82.17 20.13C83.77 17.93 85.09 15.34 84.96 12.63C84.92 11.8 84.73 10.94 84.19 10.3C83.65 9.66 82.71 9.32 81.95 9.67C80.66 10.27 80.74 12.24 79.67 13.19C79.35 13.48 78.94 13.65 78.54 13.81C73.42 15.94 68.31 18.07 63.19 20.21C61.2 21.04 59.17 21.9 57.59 23.37C56.01 24.84 54.97 27.08 55.5 29.16C55.89 30.71 57.09 31.95 58.47 32.77C59.85 33.59 61.4 34.03 62.93 34.49C66.18 35.46 69.44 36.55 72.26 38.43C75.08 40.31 77.45 43.08 78.16 46.39C78.4 47.51 78.45 48.66 78.59 49.8C78.89 52.18 79.59 54.48 80.3 56.77C80.75 58.22 81.35 59.85 82.76 60.4C83.25 60.59 83.29 61.36 82.91 61.73C82.53 62.1 81.91 62.11 81.41 61.94C80.91 61.77 80.47 61.45 80 61.21C78.53 60.44 76.79 60.42 75.13 60.42C72.13 60.42 69.12 60.41 66.12 60.4C64.31 60.4 62.48 60.4 60.72 59.97C59.45 59.66 58.21 59.14 56.91 59.1C55.29 59.04 53.73 59.73 52.31 60.52C52.1 60.63 52.21 61.02 52.44 61.02C52.67 61.02 52.76 60.62 52.55 60.52C51.3 59.9 50.12 58.9 50.65 57.61C51.18 56.32 52.48 55.51 53.8 55.07C56.31 54.24 59.04 54.47 61.68 54.72C66.86 55.21 72.04 55.69 77.22 56.18C77.12 52.84 75.43 49.79 73.77 46.89C72.9 45.37 72.01 43.81 70.64 42.71C69.17 41.53 67.31 41 65.58 40.27C63.42 39.37 61.42 38.14 59.43 36.91C56.87 35.34 54.18 33.63 52.84 30.93C51.15 27.51 52.33 22.94 55.46 20.77C56.8 19.84 58.4 19.34 59.86 18.62C62.69 17.23 65.05 15.03 67.83 13.55C69.67 12.57 71.7 11.91 73.34 10.62C75.02 9.3 76.19 7.42 77.81 6.03C78.64 5.33 79.66 4.73 80.74 4.83C81.68 4.92 82.5 5.51 83.22 6.12C84.39 7.11 85.47 8.2 86.45 9.39C87.89 11.14 89.15 13.29 88.88 15.55C88.73 16.74 88.17 17.83 87.6 18.88C85.52 22.72 83.11 26.5 79.67 29.19C76.41 31.74 72.16 33.43 70.32 37.14" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M59.73 84.36C59.94 81.13 62.54 78.21 65.72 77.62C66.46 77.48 67.39 77.54 67.75 78.21C66.19 76.64 65.55 74.41 64.58 72.42C62.41 67.94 58.44 64.46 56.58 59.84" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M57.37 54.72L57.78 53.21C58.06 52.17 58.36 51.09 59.01 50.24C60.03 48.92 61.74 48.34 63.4 48.12C65.78 47.8 68.34 48.13 70.26 49.57C72.18 51.01 73.24 53.72 72.3 55.93" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M72.17 60.87C72.19 62.44 72.29 64.19 73.42 65.27C73.87 65.7 74.44 65.97 74.99 66.28C76.27 67.01 77.42 67.96 78.37 69.08C78.71 69.48 79.04 69.92 79.19 70.43C79.38 71.08 79.26 71.77 79.15 72.43C78.6 75.72 78.17 79.04 77.88 82.36C77.83 82.89 77.79 83.43 77.75 83.96C77.74 84.14 77.75 84.36 77.92 84.43C78.09 84.5 78.17 84.12 78 84.18" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M61.53 88.11C64.25 86.66 67.82 86.99 70.22 88.93C70.73 89.34 71.2 89.83 71.81 90.09C72.42 90.35 73.22 90.31 73.62 89.78C73.9 89.42 73.91 88.93 73.89 88.47C73.71 83.84 71.14 79.68 68.65 75.77C67.23 73.54 65.81 71.31 64.4 69.08C62.68 66.37 60.91 63.53 60.59 60.34" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M62.17 54.51C63.11 53.5 64.84 53.38 65.91 54.25C66.15 54.44 66.35 54.67 66.55 54.9" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M68.7 61.19C68.12 62.8 68.32 64.66 69.22 66.11C70.08 67.5 71.49 68.44 72.56 69.67C74.52 71.92 75.25 74.99 75.43 77.97C75.61 80.95 75.3 83.93 75.47 86.91C75.43 86.07 77.66 83.8 78.3 84.11C78.81 84.36 79.23 86.59 79.29 87.1C79.44 88.29 79.24 89.53 78.68 90.6C79.53 90.4 80.18 89.74 80.91 89.26C81.64 88.78 82.67 88.5 83.35 89.05C83.42 89.11 83.49 89.18 83.58 89.19C83.67 89.2 83.78 89.13 83.76 89.04C83.74 88.95 83.56 88.99 83.6 89.07" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M81.59 91.63C82.48 90.83 83.22 89.87 84.16 89.13C85.1 88.39 86.33 87.88 87.49 88.19C88.92 88.57 89.75 90.01 90.38 91.35C90.75 92.13 91.11 92.96 91.11 93.82C91.11 95.46 89.12 98.37 87.34 98.52C86.58 98.58 85.9 98.11 85.3 97.64C85.07 97.46 84.84 97.27 84.56 97.17C84.24 97.06 83.9 97.07 83.56 97.09C81.81 97.21 75.12 99.37 74.5 97.53C74.18 96.59 75 94.9 75.21 93.98C75.64 92.09 75.73 90.21 75.26 88.31C75.4 88.17 75.62 88.13 75.8 88.2" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.78 73.04C18.62 72.8 18.32 73.18 18.3 73.46C18.12 76.32 18.67 79.22 19.87 81.82C20.06 82.22 20.26 82.62 20.59 82.92C21.01 83.31 21.65 83.58 21.71 84.15C21.14 81.77 21.49 79.28 21.84 76.85C22.05 75.36 22.27 73.87 22.48 72.38C22.57 71.78 22.72 71.1 23.26 70.84C23.95 70.51 24.7 71.1 25.23 71.65C26.45 72.9 27.67 74.16 28.89 75.41C29.39 75.92 30.35 75.78 31.05 75.64C31.75 75.5 32.39 75.17 33.01 74.81" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M75.78 96.32C78.53 96.97 81.24 95.01 84.06 94.97C85.84 94.94 87.52 95.68 89.15 96.4" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M35.05 44.34C35.9 46.27 36.82 48.17 37.8 50.03C37.76 49.88 37.72 49.73 37.68 49.58" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M48.79 52.8C49.38 54.14 50.26 55.35 51.35 56.33" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M39 53.58C42.79 59.44 44.56 66.39 47.96 72.48" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M50.53 79.43C49.7 79.27 48.96 78.75 48.42 78.1C47.88 77.45 47.53 76.65 47.3 75.84C47.07 75.05 46.95 74.16 47.37 73.46C47.83 72.68 48.88 72.37 49.75 72.61C50.62 72.85 51.3 73.57 51.68 74.39C51.88 74.82 52 75.27 52.18 75.71C52.46 76.42 52.87 77.09 53.01 77.84C53.15 78.59 52.91 79.49 52.22 79.82C52.14 79.86 52.05 79.88 51.98 79.84C51.91 79.8 51.9 79.66 51.98 79.64" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M52.06 85.22C51.06 83.83 50.15 80.22 52.76 80.35C54.96 80.46 57.06 81.58 57.98 83.61C58.47 84.69 58.68 85.88 58.89 87.05C58.95 87.38 59.01 87.74 58.89 88.05C58.74 88.46 58.31 88.72 57.88 88.77C57.45 88.82 57.01 88.71 56.61 88.55C55.42 88.09 54.4 87.28 53.4 86.48C52.92 86.1 52.43 85.71 52.07 85.21L52.06 85.22Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M49.42 74.57C49.93 77.37 51.41 79.89 52.86 82.34C53.71 83.77 54.66 85.29 56.21 85.88C56.11 85.74 56.01 85.6 55.91 85.47" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M47.63 63.14C46.97 63.96 46.87 65.18 47.39 66.1C47.61 66.48 47.98 66.82 48.41 66.8C48.67 66.79 48.9 66.64 49.1 66.48C49.87 65.85 50.32 64.83 50.27 63.84C50.25 63.53 50.19 63.21 50.02 62.95C49.67 62.4 48.85 62.22 48.28 62.55C47.71 62.88 47.45 63.64 47.66 64.26" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M50.4 66.7C50.04 67.3 49.68 67.9 49.49 68.58C49.3 69.26 49.32 70.01 49.68 70.61C50.04 71.21 50.79 71.59 51.46 71.38C51.92 71.24 52.27 70.85 52.47 70.41C52.67 69.97 52.76 69.5 52.84 69.02C52.9 68.69 52.95 68.34 52.83 68.03C52.69 67.67 52.32 67.43 51.93 67.38C51.54 67.33 51.15 67.44 50.81 67.63C50.09 68.03 49.57 68.96 49.98 69.67" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M55.9 73.74C55.03 74.05 54.05 74.49 53.83 75.38C53.71 75.89 53.88 76.42 54.12 76.89C54.25 77.15 54.42 77.41 54.68 77.54C55.18 77.79 55.78 77.49 56.18 77.1C56.63 76.67 56.97 76.09 56.98 75.47C56.99 74.85 56.63 74.2 56.04 74C55.45 73.8 54.7 74.21 54.64 74.83C54.76 74.84 54.89 74.85 55.01 74.87" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M57.74 75.49C58.51 75.8 58.85 76.73 59.58 77.13C60.36 77.56 61.48 77.15 61.8 76.32C61.98 75.86 61.93 75.35 61.83 74.87C61.7 74.22 61.49 73.59 61.21 73C60.97 72.5 60.62 71.98 60.08 71.9C59.41 71.8 58.76 72.78 58.43 71.79C58.15 70.94 57.71 70.15 57.13 69.47C57.03 69.35 56.91 69.23 56.76 69.21C56.64 69.19 56.52 69.25 56.4 69.3C56.04 69.47 55.67 69.63 55.31 69.8C55.23 69.84 55.14 69.88 55.09 69.96C55.03 70.06 55.06 70.19 55.09 70.3L55.89 73.32" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M53.7 60.81C56.13 62.75 56.96 66.03 58.61 68.67C60.47 71.64 63.51 73.99 64.36 77.39" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M66.33 88.26C66.16 89.09 66.73 89.9 66.7 90.75C66.66 91.61 66.01 92.31 65.39 92.92C64.65 93.65 63.91 94.39 63.17 95.12C63.14 95.15 63.11 95.17 63.08 95.16C63.05 95.15 63.08 95.08 63.1 95.11" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M61.78 76.69C62.13 77.43 62.32 78.24 62.36 79.06" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M63.76 87.79C64.44 90.93 63.2 94.35 60.78 96.47C58.36 98.59 54.92 99.39 51.77 98.74C48.62 98.09 45.83 96.08 44.04 93.42C43.29 92.3 42.71 91.08 42.05 89.9C41.46 88.85 40.79 87.85 40.13 86.84C39.36 85.67 38.59 84.5 37.82 83.33C36.2 80.87 34.53 78.36 32.18 76.58" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M23.94 72.46C23.71 73.56 23.5 74.82 24.16 75.72C24.68 76.44 25.6 76.72 26.47 76.92C28.08 77.29 29.82 77.49 31.33 76.83C31.99 76.54 32.58 76.09 33.13 75.63C37.17 72.23 39.96 67.38 40.86 62.18C41.02 61.24 41.1 60.19 40.54 59.42C40.17 58.91 39.59 58.62 39.03 58.35C38.21 57.96 37.25 57.57 36.42 57.94C35.41 58.39 35.09 59.75 34.11 60.27C34.45 60.08 34.78 59.9 35.12 59.71" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M40.95 65.08C40.89 66.12 41.48 67.08 42.11 67.91C43.64 69.94 45.49 71.73 47.58 73.18" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M45.93 75.9C45.41 74.47 44.84 72.96 43.67 72C42.5 71.04 40.51 70.88 39.58 72.08C39.26 72.5 39.1 73.02 38.97 73.54C38.83 74.1 38.72 74.68 38.79 75.25C38.86 75.8 39.09 76.32 39.32 76.83C40.15 78.68 40.99 80.52 41.82 82.37C42.1 83 42.39 83.63 42.85 84.15C43.31 84.67 43.96 85.05 44.65 85.01C45.35 84.97 45.97 84.49 46.35 83.9C46.73 83.31 46.88 82.6 46.97 81.9C47.34 79.24 46.95 76.49 45.86 74.03" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M41.97 74.61C40.78 76.31 41.61 79.88 42.76 81.14C43.21 81.63 43.85 82.03 44.52 81.97C45.17 81.91 45.72 81.42 45.99 80.83C46.26 80.24 46.32 79.57 46.3 78.92C46.25 77.41 45.91 74.57 44.32 73.85C41.29 72.48 41.69 78.72 44.4 78.43C44.54 78.42 44.68 78.38 44.78 78.29C44.88 78.2 44.93 78.08 44.96 77.96C45.03 77.68 45 77.38 44.96 77.09C44.82 76.24 44.55 75.41 44.16 74.64" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M34.14 80.13C33.96 81.84 33.81 83.7 34.75 85.14C35.07 85.63 35.49 86.04 35.91 86.44C36.33 86.84 36.76 87.25 37.29 87.5C38.39 88.03 39.79 87.79 40.79 88.5" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M36.67 85.84L38.13 86.74C37.99 84.58 36.59 82.74 35.24 81.04" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M34.53 83.28C34.72 83.87 35.19 84.37 35.77 84.6C35.85 84.63 35.94 84.66 36.02 84.63C36.21 84.56 36.18 84.28 36.1 84.1C35.82 83.43 35.39 82.82 34.85 82.35C35.03 82.38 35.22 82.4 35.4 82.43" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M46.97 92.83C46.92 92.52 46.79 92.18 46.96 91.92C47.17 91.59 47.68 91.67 48.01 91.87C48.34 92.07 48.66 92.36 49.05 92.37C49.5 92.37 49.84 91.99 50.2 91.72C51.1 91.03 52.37 90.97 53.45 91.34C54.53 91.71 55.42 92.47 56.19 93.3C56.28 93.4 56.38 93.52 56.35 93.65C56.33 93.74 56.26 93.8 56.19 93.85C55.66 94.19 54.97 93.91 54.36 93.76C53.68 93.59 52.98 93.59 52.28 93.58C51.76 93.58 51.2 93.59 50.79 93.92C50.59 94.08 50.45 94.3 50.27 94.49C49.8 94.98 49.05 95.18 48.39 94.99C48.01 94.88 47.67 94.65 47.3 94.49C47 94.37 46.65 94.33 46.33 94.35C46.73 93.95 47.07 93.44 46.98 92.84L46.97 92.83Z" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M38.82 66.02C38.98 65.23 39.13 64.35 38.71 63.66C38.22 62.86 37.19 62.64 36.3 62.35C33.18 61.32 30.91 58.6 29.28 55.75C28.74 54.8 28.25 53.82 27.61 52.94C25.47 50 21.95 48.48 18.6 47.09C21.6 50.63 22.77 55.33 23.85 59.85C24.03 59.73 24.1 59.47 24 59.28" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M21.76 56.36C20.55 55.94 19.22 56.1 17.96 56.36C10.99 57.78 4.68 62.22 0.980003 68.3C2.26 67.23 3.19 65.82 4.35 64.64C6.61 62.35 9.69 60.99 12.85 60.35C16.01 59.71 19.26 59.77 22.47 59.97C22.99 60 23.52 60.04 24.01 60.22C24.63 60.45 25.17 60.91 25.83 60.99" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M17.54 60.88C14.81 62.6 12.28 64.87 11.07 67.87C10.09 70.29 10.02 73.08 8.65 75.3C10.84 69.66 15.68 65.12 21.45 63.3C22.17 63.07 22.93 62.88 23.69 62.97C24.49 63.06 25.21 63.45 25.96 63.73C27.02 64.13 28.16 64.31 29.29 64.27" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M26.41 66.32C24.41 65.82 22.38 67.06 20.92 68.52C17.91 71.53 16.19 75.67 15.61 79.89C15.39 81.53 15.29 83.28 14.33 84.61C14.15 83.1 13.72 81.62 13.07 80.24C12.77 79.61 12.43 78.99 12.29 78.31C12.09 77.29 12.37 76.25 12.65 75.25C13.03 73.89 13.41 72.53 13.79 71.18C14.1 70.06 14.42 68.93 14.91 67.87" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M41.94 86.51C43.17 87.75 44.13 89.27 44.71 90.92C44.78 91.11 44.86 91.32 45.04 91.4C45.15 91.45 45.27 91.44 45.38 91.43C45.85 91.36 46.29 91.14 46.61 90.8C46.92 90.48 47.12 90.07 47.48 89.8C48.03 89.39 48.79 89.46 49.47 89.54" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M7.51 97.45C7.51 97.85 7.39 98.25 7.15 98.57C9.7 98.99 12.31 98.38 14.89 98.54C17.42 98.7 19.92 99.62 22.44 99.35C22.83 99.31 23.26 99.22 23.51 98.91C23.76 98.6 23.69 98.03 23.3 97.94" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M41.33 58.95C39.81 57.63 38.2 56.41 36.51 55.31C35.64 54.74 34.74 54.2 33.75 53.88C32.75 53.56 31.69 53.49 30.69 53.19C29.36 52.8 28.15 52.03 26.79 51.77" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M19.23 49.66C18.49 49.31 17.63 49.51 16.84 49.72C15.89 49.98 14.95 50.25 14.02 50.53C12.97 50.85 11.85 51.23 11.2 52.12C10.22 53.46 10.68 55.39 9.95 56.88C9.5 57.8 8.58 58.65 8.8 59.65" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M21.72 55.49C20.48 54.7 19.05 54.22 17.58 54.08C16.76 54 15.85 54.07 15.22 54.6C14.62 55.11 14.4 56.01 14.7 56.74C14.64 56.8 14.52 56.74 14.53 56.65" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M14.27 60.59C14.09 61.31 14.24 62.11 14.68 62.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M8.93 61.83C8.98 63.65 9.41 65.46 10.18 67.11C10.33 67.43 10.49 67.74 10.65 68.04" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M16.36 76.27C16.87 76.65 17.36 77.06 17.82 77.49" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M21.9 80.31C22.06 81.32 22.94 82.08 23.2 83.07C23.55 84.39 22.74 85.7 21.94 86.8C21.31 87.66 20.66 88.51 19.98 89.34C22.09 89.44 24.2 89.43 26.31 89.3C26.64 89.28 27.02 89.23 27.2 88.96C27.3 88.81 27.32 88.61 27.34 88.42C27.65 83.75 25.74 78.98 22.29 75.81C22.35 76.03 22.41 76.26 22.47 76.48" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M25.79 90.21C23.81 91.78 23.48 94.62 23.31 97.14C22.09 97.81 20.63 97.81 19.24 97.73C17.51 97.63 15.79 97.45 14.06 97.26C11.68 97.01 9.3 96.75 6.92 96.5C6.69 94.85 6.47 93.21 6.24 91.56C6.21 91.36 6.18 91.14 6.24 90.95C6.31 90.74 6.48 90.58 6.64 90.42C7.18 89.91 7.71 89.4 8.25 88.89C8.69 88.47 9.15 88.04 9.73 87.84C10.74 87.5 11.87 87.97 12.61 88.74C13.35 89.51 13.77 90.51 14.17 91.49" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M13.7 88.19C14.15 87.76 14.89 87.76 15.46 88.02C16.03 88.28 16.47 88.75 16.89 89.2C17.15 89.48 17.43 89.78 17.55 90.15C17.68 90.53 17.65 91 17.97 91.25C18.31 91.51 18.82 91.33 19.13 91.03C19.25 90.91 19.37 90.78 19.52 90.7C19.67 90.62 19.88 90.62 19.99 90.75" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>;  break;

                            case "Drums":     return  <svg id="Drums" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_1_185)">
                                    <path d="M31.75 14.86C38.15 11.61 44.56 8.36 50.96 5.11C51.12 5.03 51.3 4.91 51.29 4.73C51.28 4.61 51.18 4.52 51.13 4.41C51.02 4.13 51.34 3.84 51.64 3.85C51.94 3.86 52.19 4.06 52.42 4.25C52.85 4.61 53.3 5.02 53.37 5.57C53.44 6.12 52.8 6.72 52.34 6.4C52.2 6.31 52.1 6.15 51.94 6.1C51.79 6.06 51.63 6.14 51.49 6.22C45.38 9.78 39.28 13.34 33.17 16.89" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M27.44 30.99L30.79 37.75C31.45 39.07 32.11 40.42 32.31 41.88C32.51 43.32 32.23 44.78 31.96 46.22C31.69 47.66 31.41 49.1 31.14 50.54C30.94 51.57 30.74 52.63 30.21 53.53C29.22 55.22 27.13 56.43 27.12 58.39C27.12 58.73 27.19 59.08 27.39 59.36C27.96 60.16 29.18 59.99 30.13 59.74C31.85 59.28 33.86 59.36 35.58 58.9C37.14 59.18 37.68 61.35 36.92 62.74C36.16 64.13 34.64 64.89 33.2 65.54C31.85 66.15 30.46 66.74 28.99 66.92C27.52 67.1 25.93 66.84 24.8 65.88C24.11 65.3 23.63 64.51 23.18 63.72C22.7 62.89 22.22 62.02 22.12 61.07C21.98 59.68 22.66 58.35 23.32 57.12C24.28 55.33 25.25 53.55 26.21 51.76C27.91 48.61 29.66 45 28.56 41.59C27.96 39.71 26.54 38.16 25.99 36.27C25.56 34.78 25.58 32.97 24.36 32.02C24.31 32.27 24.27 32.53 24.22 32.78" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M21.19 24.22C18.31 18.65 15.17 13.22 11.78 7.94C11.05 6.81 10.29 5.66 9.22001 4.84C8.15001 4.02 6.70001 3.58 5.43001 4.03C4.64001 4.31 3.98001 4.92 3.56001 5.65C2.47001 7.53 2.96001 9.92 3.68001 11.97C4.40001 14.02 5.36001 16.11 5.12001 18.27C4.98001 19.56 4.55001 21.18 5.63001 21.89C5.95001 22.1 6.34001 22.16 6.71001 22.22C8.51001 22.51 10.64 22.69 11.87 21.35C12.58 20.58 12.79 19.5 13.22 18.55C13.74 17.41 14.59 16.44 15.65 15.78C15.35 15.83 15.06 15.88 14.76 15.93" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M25.29 25.61C24.42 24.36 23.83 22.91 23.57 21.4" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M21.24 17.37C18.93 13.34 16.2 9.55 13.11 6.08C12.04 4.88 10.91 3.7 9.53001 2.88C8.15001 2.06 6.45001 1.65 4.90001 2.07C2.29001 2.79 0.770011 5.83 1.23001 8.5C1.48001 9.96 2.20001 11.31 2.50001 12.77C2.78001 14.14 2.67001 15.56 2.64001 16.96C2.60001 18.65 2.66001 20.35 2.84001 22.04C2.90001 22.64 2.99001 23.26 3.34001 23.74C4.08001 24.74 5.57001 24.67 6.81001 24.5C9.68001 24.11 12.87 23.52 14.54 21.16C15.36 20.01 15.72 18.52 16.78 17.58" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M22.62 19.49C22.75 17.17 22.97 14.62 24.61 12.97C25.14 12.43 25.84 11.94 25.93 11.19C25.97 10.85 25.87 10.52 25.77 10.2C25.4 9.05 24.94 7.93 24.41 6.84C24.2 6.42 23.93 5.96 23.48 5.83C22.8 5.63 22.18 6.26 21.81 6.87C20.92 8.31 20.42 9.99 20.36 11.68C20.34 12.32 20.36 13.04 19.92 13.52" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M18.14 11.15C18.05 11.15 18.09 11.32 18.18 11.32C18.27 11.32 18.33 11.23 18.37 11.16C19.33 9.35 18.12 6.94 19.09 5.13C19.67 4.06 20.87 3.5 21.99 3.02C22.76 2.69 23.69 2.37 24.38 2.85C24.7 3.07 24.9 3.43 25.08 3.78C25.89 5.32 26.7 6.85 27.51 8.39C27.8 8.95 28.11 9.55 28.04 10.18C28.01 10.47 27.9 10.75 27.79 11.02C27.42 11.95 27.04 12.88 26.67 13.81C26.51 14.22 26.3 14.67 25.89 14.84C25.7 14.92 25.48 14.93 25.33 15.07C25.16 15.22 25.14 15.47 25.13 15.69C25.09 16.5 25.11 17.3 25.17 18.11C26.32 17.23 27.86 16.01 28.66 14.79C28.92 14.39 29.19 13.99 29.33 13.53C29.74 12.27 29.19 10.84 29.62 9.58C29.98 8.54 31.05 7.78 32.15 7.8C32.87 8.52 33.53 9.45 33.45 10.46C33.33 12.03 31.54 13.09 31.43 14.66C31.4 14.4 31.38 14.14 31.35 13.89" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M27.42 19.06C27.39 18.94 27.35 18.83 27.32 18.71C26.75 16.8 24.67 17.82 24.82 19.45C24.96 20.97 26.9 22.98 27.69 24.23C28.13 24.09 28.4 23.61 28.45 23.15C28.57 21.9 27.74 20.69 27.69 19.44C27.65 18.47 27.86 17.37 28.02 16.44C29.11 16.76 29.14 17.55 29.8 18.2C30.3 18.68 30.92 18.97 31.45 19.48C32.11 20.12 33.08 20.26 33.99 20.38C34.44 20.44 34.89 20.5 35.34 20.55C35.7 20.6 36.1 20.63 36.37 20.38C36.75 20.03 36.54 19.36 36.13 19.05C35.72 18.74 35.18 18.66 34.7 18.47C33.74 18.09 33.03 17.29 32.24 16.62C31.45 15.95 30.46 15.36 29.45 15.56C29.61 16.97 29.91 19.94 30.68 21.12C30.8 21.31 30.97 21.53 30.88 21.73C30.83 21.83 30.73 21.89 30.63 21.95C30.13 22.24 29.49 22.53 29.02 22.2C28.69 21.97 28.6 21.54 28.53 21.15C28.35 20.14 28.17 19.13 27.99 18.12" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M23.9 18.16C23.22 18.78 22.43 19.29 21.58 19.66C21.48 19.7 21.37 19.75 21.33 19.86C21.29 19.97 21.36 20.09 21.43 20.19C21.77 20.68 22.11 21.17 22.45 21.66C23.24 21.29 24.02 20.91 24.79 20.5" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M73.39 8.78C79.99 9.92 86.74 8.84 93.44 8.82C94.02 8.82 94.63 8.83 95.12 9.14C95.61 9.45 95.89 10.16 95.54 10.62C95.82 10.64 96.09 10.67 96.37 10.69C96.89 9.75 97.25 8.67 97.07 7.61C96.89 6.55 96.02 5.56 94.95 5.53L94.82 7.19C93.89 6.76 92.83 6.73 91.81 6.71C86.38 6.6 80.96 6.49 75.53 6.37C75.43 6.37 75.31 6.38 75.27 6.48C75.23 6.58 75.44 6.62 75.41 6.52" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M71.99 63.58C72.97 63.15 73.77 62.41 74.63 61.77C76.5 60.36 78.66 59.39 80.87 58.62C80.95 58.59 81.05 58.54 81.05 58.45C81.05 58.36 80.87 58.37 80.91 58.45" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M72.41 66.65C74.55 63.93 77.67 62 81.06 61.29" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M83.03 60.67C84.34 59.35 86.48 59.52 88.26 58.94C90.39 58.25 91.95 56.46 93.4 54.75C94.49 53.47 95.59 52.17 96.33 50.66C97.07 49.15 97.42 47.38 96.93 45.77C96.31 43.73 94.5 42.31 92.73 41.13C89.78 39.17 86.64 37.48 83.38 36.1C83.38 36.36 83.36 36.61 83.35 36.87" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M83.46 57.29C84.76 55.86 86.64 55.14 88.4 54.34C90.16 53.54 91.96 52.47 92.76 50.71C93.82 48.37 92.69 45.5 90.77 43.79C88.85 42.08 86.32 41.26 83.87 40.48" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M71.96 35.23C73.53 36.82 75.64 37.85 77.85 38.12" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M67.83 32.86C65.93 31.82 64.64 29.85 62.69 28.91C60 27.61 56.44 28.43 54.17 26.5C52.25 24.87 52.1 22.01 52.15 19.5C52.17 18.35 52.21 17.19 52.6 16.11C52.97 15.1 53.62 14.22 54.27 13.37C57.47 9.14 60.87 4.74 65.7 2.53C65.89 2.44 66.1 2.36 66.3 2.42C66.47 2.47 66.6 2.62 66.71 2.76C67.5 3.77 68.21 4.84 68.83 5.97" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M74.92 32.15C73.4 30.93 71.63 30.04 69.75 29.53C69.03 29.34 68.29 29.2 67.6 28.9C66.94 28.61 66.36 28.18 65.74 27.81C63.89 26.72 61.74 26.26 59.73 25.51C57.72 24.76 55.7 23.59 54.76 21.65C53.8 19.66 54.21 17.22 55.3 15.3C56.39 13.38 58.09 11.88 59.8 10.48C60.85 9.62 62.12 8.72 63.45 9.03" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M63.87 9.13C64.91 10.24 66.59 10.48 68.11 10.33C69.75 10.16 71.35 9.61 72.74 8.72C74.45 7.63 75.81 6.08 77.08 4.49C74.54 4.08 71.83 4.91 69.96 6.68C69.51 7.11 69.08 7.6 68.5 7.81C68.09 7.96 67.6 7.99 67.33 8.32C67.12 8.57 66.85 9.01 66.62 8.78C66.7 8.53 66.78 8.27 66.86 8.02" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M70.55 5.49L67.91 2.58C67.84 2.5 67.76 2.41 67.76 2.3C67.76 2.09 68.02 2 68.23 1.97C69.19 1.83 70.21 1.74 71.09 2.16C71.97 2.58 72.6 3.66 72.18 4.54C72.39 4.45 72.48 4.15 72.35 3.96" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M73.43 4.65L73.18 4.07C72.85 3.32 72.56 2.36 73.11 1.76C73.58 1.24 74.42 1.31 75.07 1.56C76.71 2.2 77.9 3.85 78.01 5.6" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M79.51 6.11C79.07 5.36 79.29 4.4 79.65 3.61C79.85 3.16 80.11 2.72 80.49 2.41C80.87 2.1 81.4 1.94 81.87 2.1C82.62 2.36 82.89 3.28 82.88 4.07C82.88 4.72 82.76 5.36 82.53 5.96" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M68.91 6.71L62.01 6.38C61.91 6.38 61.8 6.38 61.73 6.44C61.66 6.5 61.65 6.59 61.63 6.68C61.59 6.95 61.55 7.21 61.51 7.48C61.48 7.65 61.46 7.84 61.56 7.98C61.67 8.13 61.88 8.16 62.07 8.18C63.89 8.36 65.7 8.53 67.52 8.71" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M38.7 71.28C38.62 70.52 38.17 69.5 37.45 69.75C36.92 69.93 36.87 70.64 36.9 71.2C37.13 75.29 36.64 79.42 35.46 83.34C35.11 84.52 34.59 85.8 33.48 86.33C31.81 87.13 29.91 85.81 28.65 84.44C26.62 82.24 24.96 79.7 23.75 76.96C23.23 75.78 22.78 74.53 21.92 73.56C21.06 72.59 19.67 71.96 18.46 72.42C17.53 72.77 16.94 73.66 16.41 74.5C15.1 76.56 13.79 78.61 12.48 80.67C12.19 81.13 11.89 81.6 11.81 82.14C11.74 82.6 11.85 83.07 11.95 83.53C12.23 84.78 12.52 86.04 12.8 87.29C13.85 86.85 15.01 86.68 16.14 86.8C16.48 86.02 16.82 85.21 16.84 84.35C16.86 83.75 16.71 83.15 16.66 82.55C16.45 80.27 17.67 77.91 19.65 76.76C20.12 78.97 21.21 81.04 22.76 82.68C23.53 83.5 24.42 84.22 25.07 85.13C26.13 86.63 26.55 88.62 28 89.76C29.14 90.65 30.67 90.81 32.12 90.93C33.44 91.04 34.83 91.13 36.05 90.6C36.94 90.22 37.66 89.54 38.36 88.88C39 88.27 39.66 87.65 40.03 86.84C40.63 85.53 40.35 83.98 39.85 82.63C39.61 81.97 39.31 81.25 39.51 80.58C39.8 79.58 41.06 79.09 41.34 78.08" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M16.44 87.05L17.53 88.6C17.62 88.73 17.72 88.87 17.75 89.03C17.82 89.41 17.5 89.76 17.15 89.95C16.8 90.14 16.4 90.24 16.12 90.51C15.7 90.91 15.65 91.58 15.32 92.06C15.1 92.38 14.76 92.61 14.42 92.8C11.3 94.65 7.39999 95.12 3.92999 94.09C3.25999 93.89 2.58999 93.63 1.89999 93.59C1.85999 93.03 2.12999 92.49 2.39999 91.99C3.04999 90.76 3.69999 89.53 4.34999 88.31C4.61999 87.8 4.91999 87.27 5.43999 87.02C6.37999 86.58 7.46999 87.37 7.92999 88.3C8.38999 89.23 8.47999 90.31 8.95999 91.22" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8.67999 89.91C9.77999 89.56 11.09 90.26 11.41 91.37C11.44 91.47 11.49 91.6 11.59 91.59C11.69 91.58 11.61 91.37 11.56 91.47" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M9.42999 89.71C10.17 89.86 10.93 89.65 11.68 89.6C12.43 89.55 13.31 89.75 13.65 90.42C13.68 90.48 13.7 90.55 13.67 90.61C13.64 90.67 13.52 90.64 13.54 90.58" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M11.1 89.45C12.28 88.97 13.73 88.52 14.74 89.29" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12.9 88.44C12.81 87.86 12.24 87.52 11.8 87.13C11.36 86.74 11.04 86.01 11.47 85.62C11.59 85.51 11.84 85.48 11.89 85.64" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2.06 93.92C2.01 94.81 2 95.7 2.03 96.6C2.03 96.79 2.05 96.99 2.14 97.16C2.25 97.36 2.46 97.48 2.65 97.6C3.55 98.12 4.54 98.66 5.57 98.51C6.41 98.39 7.11 97.84 7.86 97.46C8.8 96.99 9.85 96.78 10.88 96.57C12.32 96.29 13.76 96 15.2 95.72C15.52 95.66 15.86 95.58 16.09 95.36C16.42 95.03 16.42 94.51 16.5 94.04C16.66 93.03 17.29 92.11 18.17 91.6C18.35 91.49 18.57 91.37 18.59 91.16C18.61 91.04 18.55 90.92 18.49 90.81C18.24 90.37 17.88 90 17.45 89.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M66.42 78.56C67.38 79.62 68.58 80.46 69.9 81.02C70.19 81.14 70.51 81.25 70.81 81.18C71.17 81.09 71.43 80.78 71.66 80.48C73.43 78.25 75.61 76.38 77.78 74.53C78.37 74.03 78.95 73.53 79.54 73.03C81.55 71.32 83.57 69.6 85.7 68.04C86.05 67.78 86.54 67.52 86.9 67.78C87.02 67.87 87.1 68 87.17 68.13C88.41 70.48 87.84 73.32 87.48 75.95C87.12 78.58 87.2 81.66 89.24 83.36C87.54 83.65 85.85 84.01 84.18 84.43C83.41 82.63 82.62 80.66 83.11 78.75C83.27 78.12 83.57 77.53 83.73 76.91C84.15 75.27 83.82 73.13 85.27 72.24C85.15 72.45 85.02 72.65 84.9 72.86" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M83.77 75.64C82.41 75.91 81.15 76.69 80.3 77.79C79.81 78.43 79.45 79.16 78.97 79.81C78.06 81.02 76.74 81.85 75.45 82.66C74.35 83.35 73.24 84.03 72.14 84.72C71.68 85.01 71.17 85.31 70.63 85.28C70.02 85.26 69.5 84.84 69.04 84.45C68.49 83.99 67.94 83.52 67.46 82.99C67.16 82.66 66.89 82.3 66.53 82.04C65.89 81.58 64.98 81.52 64.28 81.89" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M84.53 84.75C84.49 85.72 84.4 86.79 83.67 87.43C83.24 87.81 82.65 87.96 82.13 88.21C80.61 88.94 79.63 90.66 79.78 92.34C79.79 92.49 79.82 92.65 79.93 92.75C80.1 92.92 80.38 92.86 80.61 92.8C82.26 92.36 83.96 92.08 85.66 91.94C87.42 91.8 89.35 91.88 90.73 92.97C91.38 93.49 92.07 94.26 92.87 94.03C93.26 93.92 93.54 93.58 93.79 93.27C94.66 92.18 95.54 91.07 96.09 89.79C96.64 88.51 96.86 87.02 96.35 85.72C96.05 84.96 95.46 84.25 94.65 84.09C93.7 83.89 92.73 84.51 92.19 85.32C91.65 86.13 91.43 87.1 91.17 88.03C90.91 88.96 90.54 89.92 89.81 90.56C90.17 90.28 90.45 89.89 90.6 89.46" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M91.53 88.41C90.99 87.78 89.99 87.6 89.27 88.01C88.41 88.5 88.12 89.56 87.66 90.44C87.7 90.24 87.75 90.04 87.79 89.84" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M88.95 87.95C88.54 87.45 87.72 87.46 87.17 87.8C86.62 88.14 86.26 88.72 85.93 89.28" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M87.79 87.75C87.5 87.21 86.97 86.79 86.36 86.65C87.05 86.45 87.74 86.25 88.43 86.05C88.69 85.97 88.97 85.89 89.16 85.69C89.67 85.17 89.27 84.31 88.86 83.7" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M79.99 93.07C80.12 93.74 80.18 94.42 80.17 95.11C82.48 94.47 84.93 94.98 87.27 95.5C88.49 95.77 89.78 96.08 90.65 96.98C90.99 97.33 91.31 97.79 91.8 97.81C92.28 97.83 92.64 97.39 93.08 97.2C93.96 96.81 95.17 97.37 95.85 96.69C96.23 96.31 96.24 95.72 96.34 95.2C96.46 94.62 96.71 94.07 97.08 93.6C97.19 93.46 97.31 93.33 97.35 93.16C97.44 92.78 97.07 92.43 96.69 92.34C95.98 92.16 95.18 92.63 94.97 93.33C95.03 92.56 95.32 91.82 95.79 91.2" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M65.72 14.43C65.48 14.18 65.76 13.78 66.01 13.53C66.63 12.88 67.04 12.04 67.17 11.15C66.94 11.67 66.86 12.26 66.94 12.83C67.06 13.65 67.51 14.53 67.13 15.27C67.13 15.15 67.09 15.02 67 14.93" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M20.97 26.01C21.18 24.69 21.65 23.42 22.33 22.27C23.15 23.28 23.6 24.59 23.57 25.9" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8.10001 28.02C7.94001 26.96 8.94001 26.03 9.98001 25.78C11.02 25.53 12.11 25.76 13.18 25.83C14.86 25.94 16.54 25.64 18.22 25.71C19.82 25.78 21.39 26.18 22.99 26.28C24.25 26.36 25.52 26.25 26.78 26.19C30.29 26.03 33.83 26.24 37.29 26.84C38.17 26.99 39.1 27.19 39.77 27.78C40.1 28.08 40.34 28.64 40 28.93C39.89 29.03 39.73 29.07 39.59 29.1C34.18 30.36 28.65 31.07 23.1 31.24C23.22 30.95 23.34 30.65 23.46 30.36" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M22.34 27.54C21.46 40.5 21.6 53.51 21.74 66.5C21.77 69.01 21.8 71.53 22.14 74.02C22.2 73.76 22.26 73.51 22.32 73.25" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M22.01 69.74C23.11 70.8 24.66 71.25 25.9 72.14C27.48 73.27 28.46 75.04 29.4 76.75C30.59 78.92 31.77 81.09 32.96 83.26C32.37 83.5 31.72 83.57 31.1 83.47C31.1 84.37 31.56 85.26 32.3 85.78C32.84 85.49 33.29 85.04 33.57 84.5C33.39 83.87 32.9 83.34 32.29 83.1" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M24.8 78.85C26.19 78.09 27.44 77.07 28.46 75.86C28.38 75.99 28.22 76.07 28.06 76.06" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M22.45 69.53C26.97 70.93 31.17 73.38 34.59 76.65C33.65 76.5 32.55 76.4 31.86 77.05C31.58 77.32 31.41 77.77 31.62 78.09C31.81 78.38 32.24 78.43 32.55 78.28C32.86 78.13 33.06 77.81 33.19 77.49C33.5 77.54 33.79 77.29 33.91 77C34.03 76.71 34.01 76.39 33.98 76.08" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M21.17 68.95C14.84 73.07 8.5 77.18 2.17 81.3C1.78 81.56 1.34 81.87 1.28 82.34C1.23 82.73 1.45 83.09 1.67 83.41C2.05 83.99 2.46 84.59 3.1 84.86C4.27 85.35 5.74 84.07 5.43 82.84C5.12 81.61 3.21 81.2 2.42 82.19C2.89 82.08 3.35 81.97 3.82 81.86" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M11.82 75.22C12.45 75.45 13.15 75.22 13.82 75.26C14.6 75.29 15.36 75.67 15.85 76.27" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M19.41 66.88C19.2 67.83 19.1 68.8 19.12 69.77C19.12 69.61 19.12 69.46 19.12 69.3" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M21.56 66.46C18.65 66.82 15.63 66.3 13 64.99C13.34 64.73 13.76 64.58 14.19 64.57C15.39 57.77 15.78 50.83 15.35 43.94C15.29 44.18 15.22 44.42 15.16 44.66" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M15.43 64.02C17.42 64.19 19.42 64.3 21.43 64.34" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M18.4 45.43L17.42 61.99C17.4 61.83 17.37 61.67 17.35 61.51" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M15.68 43.89V43.19C15.69 43.13 15.81 43.16 15.75 43.16" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M24.69 46.95C24.48 48.8 24.41 50.67 24.5 52.53C24.5 52.37 24.5 52.22 24.5 52.06" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M15.8 43.27C15.05 42.92 14.36 42.45 13.76 41.89C13.85 41.96 13.93 42.04 14.02 42.11" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M16.3 43.53C17.59 44.48 19.17 44.99 20.76 45.21C22.35 45.43 23.96 45.4 25.57 45.36C26.2 45.34 26.84 45.33 27.45 45.16C27.89 45.04 28.35 44.79 28.46 44.35C28.29 44.42 28.08 44.4 27.94 44.29" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M28.07 42.2C25.08 41.29 21.91 41.22 18.79 41.16C17.02 41.13 15.25 41.09 13.48 41.06C13.34 41.06 13.18 41.06 13.07 41.15C12.87 41.31 12.95 41.65 13.15 41.8C13.35 41.95 13.62 41.97 13.87 41.98" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M52.41 33.83C53.1 33.97 53.81 34 54.52 34.03C57.95 34.17 61.41 34.31 64.79 33.71C65.06 33.66 65.4 33.52 65.37 33.24C65.34 33.04 65.11 32.93 64.92 32.87C62.8 32.2 60.63 31.64 58.41 31.5C56.19 31.36 53.91 31.69 51.93 32.7C51.65 32.84 51.37 33.01 51.16 33.25C51.38 33.79 52.07 33.93 52.65 33.92C53.23 33.91 53.88 33.85 54.32 34.22" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M49.63 33.16L41.57 32.3C39.28 32.06 36.93 31.82 34.69 32.37C33.99 32.54 33.15 33.04 33.31 33.75C33.44 34.36 34.21 34.55 34.83 34.57C36.55 34.63 38.27 34.31 39.99 34.27C43.07 34.21 46.15 35.05 49.19 34.61C49.68 34.54 50.3 34.29 50.27 33.79C50.25 33.46 49.92 33.21 49.59 33.17C49.26 33.13 48.93 33.25 48.62 33.37" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M64.57 34.01C64.42 33.9 64.2 34.01 64.12 34.17C64.04 34.33 64.06 34.53 64.08 34.71C64.36 36.92 64.64 39.13 64.93 41.34C65.38 41.32 65.83 41.3 66.29 41.28C65.56 42.01 64.47 42.22 63.44 42.29C62.41 42.36 61.35 42.34 60.4 42.75C60.56 42.71 60.73 42.66 60.89 42.62" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M56.37 48.83C57.14 46 57.56 43.08 57.6 40.15C57.6 39.73 57.6 39.26 57.32 38.93C57.23 38.82 57.11 38.73 57.07 38.59C57.02 38.41 57.13 38.23 57.23 38.08C57.55 37.59 57.88 37.1 58.34 36.74C59.09 36.16 60.17 36.03 61.04 36.42C61.91 36.81 62.53 37.71 62.59 38.66C62.6 38.81 62.59 38.99 62.47 39.09C62.32 39.22 62.07 39.15 61.93 39C61.79 38.85 61.74 38.65 61.66 38.46C61.24 37.54 60 37.11 59.1 37.57C58.2 38.03 57.84 39.3 58.35 40.18C58.49 40.41 58.68 40.62 58.79 40.87C58.92 41.18 58.91 41.53 58.95 41.86C59.09 43.07 59.86 44.1 60.49 45.14C61.12 46.18 61.67 47.42 61.31 48.58C61.29 48.21 61.28 47.84 61.26 47.47" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M62.22 47.53C63.15 46.57 63.84 45.38 64.2 44.1C64.3 43.76 64.37 43.41 64.54 43.09C64.93 42.33 65.75 41.9 66.55 41.61C67.94 41.11 69.44 40.89 70.91 40.97C71.7 41.01 72.56 41.18 73.05 41.8C73.27 42.08 73.4 42.43 73.47 42.78C73.9 44.86 72.58 47 70.78 48.14C70.31 48.44 69.76 48.69 69.21 48.6C68.66 48.51 68.16 47.94 68.34 47.41C68.48 47 68.93 46.78 69.36 46.71C69.79 46.64 70.24 46.64 70.63 46.46C71.34 46.14 71.66 45.3 71.79 44.53C71.88 44.01 71.9 43.43 71.61 42.99C71.3 42.53 70.71 42.32 70.16 42.34C69.61 42.36 69.08 42.56 68.56 42.75C68.02 42.96 67.44 43.2 67.15 43.7C66.98 43.99 66.93 44.34 66.89 44.68C66.57 47.29 66.33 49.99 65.14 52.33C65.09 52.43 65.03 52.54 64.93 52.59C64.8 52.66 64.63 52.62 64.5 52.55C63.62 52.11 63.18 50.76 62.21 50.88C62.02 50.9 61.7 50.84 61.8 50.67" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M61.49 50.8C61.51 51.13 61.53 51.47 61.41 51.78C61.29 52.09 60.99 52.35 60.66 52.32C60.29 52.29 60.06 51.93 59.81 51.65C58.83 50.55 57.16 50.49 55.68 50.5C54.8 50.51 53.87 50.54 53.14 51.02C53.07 51.07 52.99 51.14 53.01 51.22C53.03 51.3 53.2 51.27 53.16 51.2" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M52.76 51.68C52.64 50.9 52.08 50.19 51.34 49.91C50.19 50.49 48.97 50.95 47.72 51.26C47.72 52.18 48.02 53.11 48.58 53.84C45.5 55.04 43.1 57.85 42.4 61.08C41.94 60.63 41.47 60.16 40.86 59.95C40.25 59.74 39.47 59.89 39.15 60.45C38.81 61.05 39.15 61.85 39.73 62.22C40.31 62.59 41.03 62.63 41.72 62.6C39.88 66.11 39.43 70.33 40.49 74.15C39.82 74.19 39.21 74.75 39.12 75.42C39.03 76.09 39.46 76.79 40.1 77.01C40.87 76.61 41.63 76.22 42.4 75.82C44.07 78.59 46.08 81.61 49.25 82.26C48.51 82.93 47.94 83.78 47.59 84.71C48.79 84.66 49.99 84.94 51.05 85.5C50.89 84.74 51.18 83.9 51.78 83.41C55.01 83.85 58.33 83.62 61.47 82.74C61.82 83.68 62.43 84.51 63.21 85.13C63.54 84.57 64.06 84.13 64.66 83.9L63.09 81.48C64.61 78.48 68.43 77.16 69.89 74.13C70.56 74.48 71.28 74.71 72.02 74.82L72.14 71.76L70.4 71.35C71.47 69.25 72.04 66.9 72.04 64.55C72.04 62.73 71.83 60.61 73.19 59.41C72.51 59.27 71.82 59.13 71.14 58.98C70.85 58.92 70.54 58.85 70.3 58.67C70.03 58.47 69.88 58.14 69.73 57.84C68.44 55.26 66.25 53.15 63.64 51.94C64.28 52.11 64.95 52.14 65.6 52.04" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M54.07 76.52C54.47 75.75 55.26 75.2 56.12 75.08C56.44 75.04 56.79 75.05 57.06 74.87C57.36 74.68 57.49 74.32 57.57 73.97C57.76 73.24 57.84 72.49 57.82 71.74C59.55 71.4 61.32 73.26 62.92 72.51C63.73 72.13 64.12 71.22 64.44 70.39C64.9 71.35 65.37 72.31 65.83 73.27C66.04 73.69 66.24 74.19 66.05 74.62C65.89 74.99 65.46 75.19 65.06 75.24C64.3 75.32 63.57 74.96 62.83 74.75C62.09 74.54 61.18 74.53 60.7 75.13C60.53 75.34 60.44 75.61 60.31 75.85C59.76 76.85 58.38 77.28 57.35 76.78C56.94 76.58 56.61 76.27 56.24 76C55.87 75.73 55.44 75.52 54.99 75.56C54.54 75.6 54.1 75.99 54.14 76.44" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M57.06 75.02L64.52 73.51C64.87 73.44 65.32 73.41 65.49 73.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M56.5 56.93C56.61 56.68 56.92 56.61 57.18 56.57C58.77 56.34 60.38 56.21 61.97 56.43C63.56 56.65 65.13 57.24 66.32 58.31C67.17 59.08 67.79 60.05 68.41 61.02C68.95 61.87 69.51 62.84 69.29 63.82C69.01 65.03 67.62 65.67 66.38 65.7C65.14 65.73 63.91 65.34 62.67 65.32" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M64.21 57.68C64.46 58.29 64.89 58.83 64.99 59.49C65.09 60.15 64.59 60.95 63.95 60.8C63.4 60.67 63.21 59.99 63.13 59.43C63.02 58.67 62.94 57.82 63.41 57.22C63.41 57.46 63.42 57.7 63.43 57.94" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M61.49 56.79C61.62 58.07 61.52 59.37 61.19 60.62C61.13 60.83 61.07 61.07 61.16 61.27C61.22 61.41 61.35 61.51 61.48 61.6C62.18 62.11 62.98 62.48 63.82 62.68C64.36 62.81 64.95 62.87 65.47 62.68C66.17 62.41 66.65 61.64 66.58 60.89" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M61.27 58.46C60.18 58.71 58.91 59.13 58.61 60.21C58.47 60.72 58.6 61.26 58.79 61.74C59.21 62.8 59.96 63.73 60.9 64.37C61.63 64.86 62.56 65.3 62.74 66.16C62.88 66.83 62.5 67.48 62.13 68.05C61.81 68.55 61.49 69.06 61.17 69.56C60.97 69.87 60.76 70.2 60.42 70.35C59.82 70.62 59.15 70.21 58.57 69.9C57.99 69.59 57.14 69.42 56.77 69.96C56.33 70.61 56.86 71.88 56.1 72.05C55.26 72.24 54.81 70.38 54.07 70.82C53.82 70.97 53.77 71.29 53.67 71.56C53.34 72.42 52.32 72.78 51.41 72.95C50.27 73.17 48.9 73.17 48.2 72.25C47.66 71.54 47.76 70.47 48.3 69.76C48.84 69.05 49.71 68.65 50.6 68.53C51.36 68.43 52.15 68.5 52.86 68.22C54.17 67.71 54.78 65.91 54.05 64.7" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M55.38 56.2L52.32 55.88C51.85 55.83 51.37 55.78 50.9 55.88C50.2 56.03 49.61 56.51 49.11 57.02C48.15 58.01 47.41 59.21 46.94 60.5C46.35 62.12 46.19 63.9 45.38 65.42C44.99 66.16 44.45 66.82 43.92 67.47C43.56 67.91 43.21 68.34 42.85 68.78" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M46.46 63.79C46.32 63.82 46.32 64.02 46.37 64.15C46.91 65.75 48.79 66.75 50.42 66.32C51.39 66.06 52.19 65.39 52.95 64.74C53.6 64.19 54.26 63.61 54.63 62.85C55 62.09 55 61.07 54.4 60.47C53.74 59.81 52.67 59.88 51.74 59.99C51.29 59.53 51.39 58.78 51.63 58.18C51.87 57.58 52.23 57 52.2 56.36L52.3 56.53" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M51.84 56.68C51.38 57.99 50.91 59.34 50.97 60.73C51 61.39 51.08 62.21 50.52 62.57C50.3 62.71 50.02 62.74 49.76 62.76C49.56 62.78 49.35 62.79 49.16 62.71C48.98 62.63 48.85 62.47 48.74 62.31C48.31 61.72 47.92 61.1 47.58 60.45" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M48.43 59.26C48.2 59.57 48.36 60.06 48.71 60.23C49.06 60.4 49.5 60.26 49.73 59.96C49.96 59.66 50.01 59.24 49.91 58.87C49.82 58.57 49.64 58.29 49.62 57.97C49.58 57.32 50.21 56.86 50.76 56.52" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M27.52 67.13C28.69 68.51 30.19 69.62 31.86 70.32C33.08 70.84 34.56 71.31 34.99 72.57C35.28 73.43 34.95 74.36 34.6 75.2C34.15 74.93 33.69 74.66 33.24 74.4C33.06 74.29 32.87 74.18 32.75 74C32.63 73.82 32.63 73.55 32.8 73.42C33.07 73.2 33.44 73.48 33.68 73.73C33.92 73.98 34.35 74.2 34.56 73.93" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M40.01 79.75C40.59 80.29 41.24 80.75 41.94 81.11C42.97 81.64 44.11 81.96 45.1 82.56C45.76 82.96 46.46 83.51 47.22 83.34" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M34.05 65.47C34.16 66.56 33.66 67.62 33.63 68.71C33.58 70.48 34.72 72.04 35.81 73.44C35.87 73.51 35.95 73.59 36.04 73.56C36.13 73.53 36 73.36 35.98 73.45" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M34.78 58.34C35.98 56.26 37.51 54.37 39.28 52.75C38.33 51.9 36.94 51.57 35.71 51.91C34.64 52.2 33.73 52.95 33.07 53.84C32.41 54.73 31.95 55.77 31.75 56.85C31.21 56.51 30.9 55.85 30.98 55.22C31.03 54.83 31.21 54.48 31.39 54.13C32.3 52.36 33.38 50.44 35.25 49.75C36.73 49.21 38.39 49.57 39.84 50.17C41.32 50.78 42.69 51.63 43.9 52.68" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M43.23 51.84C42.5 51.22 42.71 50.04 42.26 49.2C41.73 48.2 40.42 47.89 39.67 47.03C39.2 46.49 38.98 45.75 38.43 45.3C38.18 45.1 37.87 44.97 37.65 44.74C37.03 44.08 37.39 43.02 37.78 42.21C37.97 41.81 38.19 41.39 38.58 41.2C38.79 41.1 39.03 41.07 39.26 41.06C40.39 41.01 41.59 41.31 42.34 42.16C41.72 41.92 40.99 41.93 40.42 42.28C39.85 42.63 39.5 43.33 39.65 43.98C39.77 44.49 40.15 44.89 40.52 45.26C41.14 45.88 41.76 46.5 42.5 46.96C43.32 47.47 44.27 47.75 45.1 48.25C45.93 48.75 46.67 49.57 46.67 50.54C46.67 50.33 46.67 50.12 46.68 49.91" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M46.64 49.23C46.94 48.13 47.2 47.02 47.38 45.89C47.53 44.95 47.61 43.93 47.16 43.09C46.73 42.3 45.91 41.81 45.13 41.37C44.96 41.27 44.78 41.17 44.58 41.17C44.18 41.17 43.87 41.58 43.85 41.98C43.83 42.38 44.03 42.76 44.25 43.1C43.77 42.49 43.41 41.79 43.2 41.04C43.05 40.49 43 39.85 43.34 39.4C43.86 38.72 44.95 38.88 45.68 39.32C48.07 40.78 48.55 44.15 50.66 46C50.88 46.19 51.12 46.37 51.27 46.62C51.65 47.27 51.27 48.11 51.4 48.86C51.5 48.49 51.68 48.15 51.92 47.86" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M51.81 48.36C52.41 46.82 52.68 45.16 52.59 43.51C52.57 43.23 52.54 42.94 52.38 42.71C52.24 42.52 52.02 42.41 51.81 42.3C51.31 42.05 50.8 41.8 50.25 41.72C49.7 41.64 49.09 41.76 48.71 42.17C48.52 41.75 48.45 41.28 48.48 40.83C48.49 40.68 48.52 40.51 48.61 40.39C48.79 40.15 49.13 40.12 49.43 40.14C51.86 40.26 54.13 41.94 54.97 44.22C55.57 45.85 55.46 47.65 55.35 49.39" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M50.01 34.5C50.1 34.5 50.03 34.33 49.95 34.37C49.87 34.41 49.86 34.52 49.87 34.61C50.01 36.5 50.19 38.4 50.43 40.28C50.39 39.99 50.43 39.69 50.54 39.43" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M33.84 34.55C33.79 35.03 33.87 35.52 33.93 36C34.29 38.66 34.27 41.37 33.86 44.03C33.88 43.73 33.91 43.43 33.93 43.13" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M36.24 44.02C35.15 44.05 34.07 44.3 33.07 44.73C32.91 44.8 32.74 44.89 32.66 45.05C32.56 45.26 32.69 45.52 32.88 45.65C33.07 45.78 33.31 45.82 33.54 45.85C35.41 46.1 37.27 46.35 39.14 46.6C38.85 46.6 38.56 46.6 38.27 46.59" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M52.33 34.2C52.71 35.48 53.02 36.79 53.24 38.11C53.37 38.88 53.46 39.74 53.02 40.38C52.91 40.54 52.77 40.7 52.82 40.89C52.87 41.08 53.23 41.04 53.16 40.87" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M54.24 42.96C55.17 43.12 56.11 43.15 57.05 43.06" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8.26001 27.82C8.43001 28.34 8.98001 28.63 9.48001 28.85C11.7 29.83 14.11 30.59 16.52 30.27C17.1 30.19 17.68 30.05 18.27 30.01C19.38 29.93 20.48 30.21 21.55 30.48C21.64 30.5 21.75 30.54 21.77 30.63C21.79 30.72 21.62 30.79 21.61 30.69" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8.01999 27.83C18.24 27.9 28.45 28.29 38.65 29" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M66.27 34.43C73.94 31.85 82.21 31.07 90.23 32.18C90.45 32.58 89.95 32.99 89.52 33.17C82.59 36.02 74.78 35.33 67.32 34.58C67.06 34.55 66.73 34.44 66.75 34.19" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M78.58 33.72C78.4 33.45 78.41 33.09 78.42 32.77C78.45 32.03 78.48 31.28 78.51 30.54C79.11 31.27 79.64 32.05 80.1 32.87C80.22 33.08 80.34 33.32 80.28 33.56C80.16 34.04 79.5 34.08 79.01 34.01C79.26 33.95 79.52 33.88 79.77 33.82" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M78.83 35.73C79.72 43.4 79.73 51.17 78.87 58.85" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M78.26 62.66L78.05 67.02C78.02 67.56 77.96 68.18 77.53 68.51C77.02 68.9 76.19 68.72 75.75 69.18C75.42 69.52 75.45 70.05 75.48 70.53C75.61 72.5 75.44 74.49 74.98 76.41C75.13 75.67 75.14 74.9 75.03 74.15" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M77.61 68.59C79.11 68.92 80.54 69.57 81.78 70.48" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M82.49 35.21C82.54 46.74 82.36 58.28 81.95 69.81" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M81.79 69.73C81.37 69.4 80.76 69.39 80.26 69.58C79.76 69.77 79.34 70.13 78.94 70.49C76.59 72.65 74.72 75.29 72.35 77.44C71.57 78.15 70.5 78.85 69.53 78.43C69.68 77.42 71.06 76.85 71.88 77.46C71.96 77.38 72.03 77.3 72.11 77.22" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M81.81 69.43H83.34" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M88.62 71.52L92.04 73.39C93.17 74.01 94.33 74.65 95.13 75.66C95.52 76.14 95.8 76.7 96.19 77.18C97.19 78.45 98.83 79.27 99.34 80.8C98.63 81.06 97.87 80.64 97.24 80.23C95.9 79.33 94.49 78.3 92.88 78.31C93.2 77.72 94.03 77.69 94.67 77.87C95.31 78.05 95.97 78.36 96.61 78.19C96.59 77.98 96.44 77.79 96.24 77.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M80.01 78.15C78.93 81.1 78.35 84.23 78.29 87.37C78.29 87.49 78.29 87.63 78.36 87.73C78.44 87.86 78.62 87.91 78.77 87.9C79.27 87.87 79.58 87.32 79.68 86.83C79.78 86.34 79.8 85.79 80.11 85.4C80.3 85.16 80.6 84.96 80.59 84.65C80.58 84.28 80.05 84.11 79.73 84.29C79.41 84.47 79.24 84.84 79.1 85.19C78.98 85.49 78.86 85.8 78.73 86.1C78.6 85.86 78.47 85.62 78.35 85.38" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M82.2 30.98C82.68 29.51 83.02 27.99 83.21 26.45C83.26 26.05 83.3 25.63 83.18 25.25C83.06 24.87 82.73 24.52 82.33 24.49C82.08 24.81 82.07 25.26 82.07 25.66C82.07 27.01 82.07 28.37 82.06 29.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M85.51 29.84C82.56 28.59 80.71 25.39 77.68 24.36C76.61 24 75.46 23.93 74.4 23.55C73.26 23.14 72.28 22.39 71.32 21.65C70.06 20.66 68.81 19.66 67.57 18.64C66.9 18.09 66.16 17.16 66.67 16.45C66.76 16.32 66.9 16.15 66.81 16.02C66.72 15.89 66.58 16.23 66.71 16.13" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M48.5 19.91C49.66 19.2 50.9 18.64 52.19 18.23" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M54.17 17.8C64.92 13.81 76.8 12.94 88.01 15.33C81.39 16.97 74.59 17.92 67.78 18.16" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M66.37 18.67C65.61 18.62 64.85 18.77 64.1 18.89C60.69 19.46 57.22 19.49 53.77 19.52C53.97 19.56 54.17 19.59 54.37 19.63" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M48.24 20.41C48.1 20.38 48.27 20.18 48.42 20.17C49.98 20.07 51.54 19.97 53.09 19.86" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_1_185">
                                        <rect width="100" height="100" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>; break ;

                            case "Gittare":   return  <svg id="Gittare" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M29.65 29.71C29.92 27.96 30.85 26.31 32.22 25.19C33.05 24.51 34.04 24.01 34.79 23.23C35.86 22.12 36.34 20.58 36.68 19.09C37.07 17.41 37.29 15.49 36.24 14.12C35 12.51 32.64 12.46 30.61 12.56C29.42 12.62 28.23 12.67 27.04 12.73C24.92 12.83 22.37 13.21 21.53 15.16C21.19 15.94 21.22 16.82 21.25 17.67C21.33 19.78 21.42 21.89 21.51 23.99C21.55 24.94 21.6 25.89 21.83 26.8C22.36 28.84 23.82 30.54 25.55 31.75C27.28 32.96 29.28 33.7 31.28 34.38C34.42 35.44 37.73 36.33 41 35.85C44.27 35.37 47.5 33.17 48.23 29.94C48.44 28.99 48.82 27.68 49.78 27.83C50.49 27.94 50.75 28.86 50.64 29.58C50.53 30.3 50.23 31.03 50.44 31.72C50.64 32.35 51.29 32.79 51.95 32.75C52.61 32.71 53.2 32.18 53.31 31.53C53.57 30.06 51.62 28.85 51.93 27.38C53.83 29.17 56.62 29.96 59.18 29.43C59.41 29.38 59.65 29.32 59.84 29.18C60.35 28.83 60.4 28.05 60.1 27.51C59.8 26.97 59.24 26.63 58.68 26.38C57.54 25.88 56.28 25.67 55.04 25.77C56.6 25.41 58.17 25.05 59.73 24.69C60.08 24.61 60.46 24.51 60.67 24.21C61.11 23.57 60.35 22.76 59.62 22.49C57.53 21.74 54.98 22.59 53.76 24.45C55.05 23.29 56.46 22.07 58.18 21.83C58.61 21.77 59.06 21.77 59.44 21.57C60.1 21.23 60.35 20.28 59.94 19.66C56.87 20.12 53.87 21.08 51.09 22.49C52.18 21.99 53.18 21.3 54.04 20.47C54.21 20.3 54.39 20.1 54.37 19.86C54.33 19.42 53.74 19.33 53.3 19.36C52.41 19.43 51.48 19.51 50.74 20.01C49.28 20.99 49.17 23.13 48.01 24.44C47.66 24.84 47.22 25.15 46.86 25.54C45.24 27.3 45.53 30.35 43.69 31.87C42.45 32.89 40.67 32.85 39.07 32.75C35.44 32.53 31.45 32.15 28.89 29.56C27.48 28.13 26.71 26.22 26 24.34C25.47 22.94 24.96 21.52 24.79 20.04C24.7 19.19 24.73 18.28 25.17 17.54C25.8 16.47 27.11 16.02 28.31 15.68C29.5 15.34 31.09 15.18 31.7 16.26C32.15 17.06 31.74 18.06 31.34 18.89C30.01 21.57 28.68 24.25 27.36 26.94" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M26.54 32.89C25.86 34.71 24.01 36.25 24.37 38.15C24.71 39.98 26.81 40.77 28.38 41.78C30.89 43.38 32.51 46.31 32.52 49.29C32.52 49.93 32.46 50.61 32.75 51.19C33.04 51.77 33.84 52.14 34.34 51.73C34.51 51.59 34.61 51.38 34.71 51.18C34.98 50.62 35.25 50.04 35.29 49.43C35.33 48.94 35.21 48.45 35.1 47.96C34.61 45.84 34.12 43.71 33.63 41.59C33.58 41.37 33.53 41.15 33.4 40.97C33.25 40.76 33.02 40.63 32.8 40.5C31.33 39.65 29.91 38.71 28.56 37.68C28.12 37.34 27.66 36.97 27.47 36.46C27.09 35.48 27.76 34.43 28.39 33.59" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M37.26 55.11C37.26 55.72 37 56.29 36.82 56.87C36.64 57.45 36.56 58.12 36.89 58.63C37.08 58.92 37.37 59.11 37.68 59.28C39.31 60.15 41.24 60.22 43.09 60.26C43.92 60.28 44.8 60.29 45.52 59.86C46.24 59.43 46.65 58.4 46.14 57.74" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M40.04 55.08C38.55 57.58 36.93 60 35.31 62.42C34.68 63.36 34.05 64.3 33.42 65.24" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M33.18 63.53L32.85 66.54C33.28 66.68 33.71 66.82 34.14 66.96C34.68 66.51 34.77 65.61 34.32 65.06" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M43.12 55.56L37.98 62.96C37.38 63.82 36.76 64.74 36.74 65.79C36.68 65.57 36.63 65.36 36.57 65.14C36.28 64.79 35.65 65.14 35.59 65.59C35.53 66.04 35.83 66.45 36.11 66.81C36.3 67.06 36.5 67.31 36.69 67.56C36.78 67.68 36.88 67.8 37.02 67.86C37.46 68.03 37.81 67.45 37.87 66.99C37.96 66.3 37.71 65.38 37.01 65.34" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M45.19 56.13C44.1 59.5 42.71 62.78 41.06 65.91C40.58 66.82 40.07 67.74 39.9 68.76C39.91 68.16 39.19 67.68 38.65 67.93C38.77 68.63 39.04 69.3 39.42 69.89C39.57 70.11 39.74 70.34 40 70.43C40.54 70.62 41.1 70.01 41.08 69.44C41.06 68.87 40.66 68.38 40.25 67.98" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M42.64 68.37C40.63 67.22 38.77 65.83 36.99 64.35C36.41 63.87 35.82 63.36 35.13 63.05C34.58 62.8 33.98 62.68 33.38 62.56C32.69 62.42 32 62.28 31.31 62.14C30.89 62.05 30.43 61.98 30.05 62.18C29.57 62.44 29.43 63.08 29.51 63.62C29.59 64.16 29.85 64.65 29.99 65.18C30.1 65.62 30.07 66.19 29.68 66.41C33.45 67.76 36.89 70 39.65 72.9C39.8 73.06 39.98 73.24 40.2 73.26C40.39 73.28 40.57 73.18 40.74 73.1C41.65 72.68 42.73 72.67 43.65 73.07C43.11 72.45 43.06 71.46 43.53 70.79C43.7 70.55 43.92 70.35 44.02 70.08C44.18 69.66 43.99 69.17 43.67 68.85C43.35 68.53 42.92 68.34 42.51 68.17" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M70.77 50.98C71.77 54.6 75.66 57.18 79.39 56.68C83.23 56.17 86.23 52.79 87.34 49.07C87.47 48.63 87.58 48.17 87.47 47.73C87.36 47.29 86.96 46.89 86.5 46.93C86.15 46.96 85.88 47.24 85.63 47.49C84.2 48.94 82.58 50.19 80.82 51.21C79.74 51.84 78.52 52.39 77.28 52.23C75.58 52.01 74.28 50.52 72.59 50.24C70.99 49.97 69.43 50.85 68.15 51.86C66.87 52.87 65.68 54.05 64.14 54.57C62.99 54.96 61.75 54.94 60.54 54.98C58.23 55.04 55.91 55.32 53.72 56.04C52.58 56.41 51.44 56.91 50.24 56.91C47.93 56.91 46.03 55.1 43.8 54.49C41.65 53.9 39.24 54.43 37.22 53.49C36.73 53.26 36.22 52.72 36.5 52.26C36.76 51.83 37.41 51.96 37.88 52.15C38.81 52.53 39.75 52.9 40.68 53.28C39.48 52.36 38.35 51.33 37.32 50.21C37.12 50 36.92 49.76 36.87 49.47C36.73 48.69 37.74 48.22 38.54 48.21C40.36 48.19 42.15 49.14 43.17 50.64C42.84 49.52 41.71 48.88 40.85 48.08C39.99 47.28 39.4 45.82 40.25 45.02C40.83 44.48 41.81 44.6 42.44 45.08C43.07 45.56 43.44 46.31 43.76 47.04C44 47.57 44.27 48.15 44.78 48.41C45.29 48.67 46.11 48.36 46.08 47.78C46.04 47.03 44.94 47.01 44.22 47.23C43.66 47.23 43.51 46.34 43.93 45.96C44.35 45.58 44.98 45.6 45.54 45.64C46.18 45.69 46.83 45.74 47.4 46.03C47.97 46.32 48.43 46.91 48.38 47.54C48.32 48.23 47.7 48.73 47.49 49.39C47.22 50.22 47.65 51.12 48.24 51.76C49.42 53.04 51.21 53.61 52.95 53.63C54.69 53.65 56.39 53.17 58.04 52.62C59.83 52.02 61.59 51.32 63.31 50.52C65.17 49.66 67 48.68 69.02 48.33C72.03 47.8 75.09 48.72 78.15 48.77C79.99 48.8 81.98 48.44 83.23 47.09C83.99 46.27 84.38 45.19 84.9 44.2C85.42 43.21 86.17 42.23 87.25 41.95C87.79 41.81 88.37 41.86 88.92 42.01C91.53 42.71 93.22 45.79 92.42 48.37C92.18 49.14 91.76 49.84 91.34 50.53C89.82 53.06 88.21 55.67 85.74 57.28C83.17 58.96 79.97 59.35 76.9 59.42C75.98 59.44 75.05 59.44 74.15 59.22C71.11 58.49 69.2 55.56 67.6 52.87" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M63.19 49.87L60.6 49.35C60.33 49.3 60.05 49.24 59.77 49.29C59.51 49.33 59.26 49.46 59.03 49.59C58.15 50.07 57.28 50.56 56.4 51.04C55.58 51.49 54.69 51.96 53.76 51.85" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M66.04 48.55C64.11 46.7 61.01 46.22 58.61 47.41C57.18 48.12 55.95 49.36 54.37 49.53" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M52.39 53.41C53.63 50.9 52.91 47.57 50.73 45.81C50.39 45.53 50 45.28 49.57 45.18C48.95 45.03 48.31 45.18 47.67 45.14C45.07 45 43.27 41.97 40.66 41.97C38.98 41.97 37.56 43.3 36.84 44.82C36.12 46.34 35.93 48.03 35.57 49.67C35.26 51.05 34.83 52.39 34.28 53.69C34.13 54.05 33.95 54.42 33.64 54.66C32.92 55.21 31.87 54.81 30.99 55.03C29.54 55.39 29.08 57.17 28.22 58.4C27.4 59.57 26.04 60.38 25.57 61.73C25.09 63.1 25.68 64.59 25.88 66.03C26.15 68.03 25.66 70.12 26.27 72.05C26.8 73.71 28.07 75.01 29.29 76.24C30.54 77.49 31.85 78.78 33.52 79.37C35.42 80.03 37.51 79.69 39.48 79.29C41.79 78.82 44.11 78.28 46.22 77.24C48.65 76.04 50.76 74.18 52.25 71.91C53.32 70.29 54.08 68.26 53.46 66.42C53.07 65.25 52.17 64.33 51.29 63.47C50.41 62.61 49.47 61.75 48.95 60.63C48.43 59.51 48.44 58.04 49.32 57.18" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M43.34 45.05L46.91 37.32C47.87 35.25 48.83 33.18 49.78 31.1" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M45.81 45.14C47.84 41.1 49.69 36.98 51.35 32.78" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M48.68 44.97L52.26 39.12C52.68 38.43 53.1 37.74 53.48 37.03C54.66 34.8 55.39 32.37 56.12 29.96" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M58.79 19.26C59.5 17.51 59.94 15.66 60.64 13.9C61.34 12.14 62.37 10.44 63.94 9.4C65.51 8.36 67.74 8.13 69.26 9.25C69.47 9.41 69.69 9.62 69.69 9.88C69.69 10.08 69.57 10.26 69.45 10.42C68.46 11.78 67.47 13.15 66.48 14.51C65.92 15.28 65.26 16.11 64.31 16.23C63.29 16.36 62.35 15.54 61.98 14.59C61.61 13.64 61.67 12.58 61.74 11.56" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M67.91 11.32L64.5 10.94C64.01 11.75 63.51 12.6 63.5 13.54C63.49 14.48 64.17 15.5 65.11 15.5" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M67.29 12.99L65.54 15.59C65.05 15.08 64.71 14.39 64.77 13.68C64.83 12.97 65.36 12.29 66.06 12.21C66.76 12.13 67.48 12.83 67.31 13.51" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M54.91 20.51C55.39 17.71 56.84 15.18 57.85 12.53C58.1 11.88 58.32 11.2 58.3 10.5C58.28 9.8 57.96 9.08 57.36 8.74C56.6 8.31 55.66 8.59 54.84 8.86C54.6 8.94 54.36 9.02 54.17 9.19C53.95 9.38 53.84 9.66 53.74 9.94C53.32 11.14 53.15 12.42 53.23 13.68C53.28 14.47 53.57 15.42 54.34 15.61C54.86 15.74 55.39 15.46 55.81 15.12C56.23 14.78 56.58 14.36 57.07 14.13" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M57.32 10.04C56.38 10.62 55.48 11.26 54.61 11.94C54.52 13.13 54.88 14.36 55.59 15.32" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M56.7 20.26C57.98 16 59.84 11.91 62.21 8.14999" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M52.47 19.34L51.8 15.54C51.71 15.05 51.63 14.54 51.7 14.05C51.88 12.8 53.05 11.64 52.59 10.47C52.4 9.99001 51.96 9.61001 51.92 9.10001C51.87 8.52001 52.36 8.01 52.32 7.43C52.26 6.7 51.44 6.32 50.73 6.11C49.47 5.72 48.13 5.35 46.86 5.7C45.59 6.05 44.51 7.41 44.95 8.65C45.06 8.97 45.27 9.3 45.15 9.61C44.94 10.23 43.96 9.93 43.58 9.41C42.62 8.09 42.96 6.09 44.14 4.96C45.32 3.83 47.13 3.52 48.71 3.92C50.02 4.25 51.25 5.02 52.6 4.99C53.34 4.98 54.06 4.72 54.79 4.57C55.52 4.42 56.32 4.37 56.97 4.74C57.62 5.11 57.99 6.02 57.56 6.64C57.69 6.46 57.82 6.29 57.95 6.11" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M54.99 4.67L55.81 1.68C56.75 1.37 57.76 1.29 58.74 1.45C59.46 1.57 60.17 1.81 60.9 1.82C61.63 1.82 62.34 1.61 63.03 1.39C62.29 1.9 61.53 2.44 61.06 3.2C60.62 3.92 60.48 4.77 60.22 5.57C59.93 6.47 59.5 7.32 58.93 8.07C59.08 7.92 59.22 7.77 59.37 7.63" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M60.38 4.73C62 4.74 63.63 4.15 64.85 3.08C65.2 2.78 65.53 2.43 65.95 2.25C66.97 1.79 68.23 2.38 69.26 1.94C68.22 2.05 67.26 2.61 66.51 3.34C65.76 4.07 65.17 4.95 64.61 5.84C64.29 6.34 63.97 6.85 63.5 7.2" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M65.24 4.35C66.9 4.44 68.59 4.13 70.12 3.46C70.92 3.11 71.67 2.67 72.48 2.35C73.89 1.8 75.46 1.67 76.94 1.97C76.28 2.01 75.66 2.3 75.06 2.59C74.54 2.84 74.03 3.08 73.51 3.33C72.98 3.58 72.45 3.84 71.95 4.16C70.88 4.84 70.02 5.8 69.22 6.78" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M72.4 4.26C75.92 3.69 79.72 3.16 82.9 4.77C84.17 5.41 85.37 6.59 85.27 8.01C85.16 9.56 83.61 10.57 82.93 11.96C83.57 11.47 83.68 10.5 83.41 9.73C83.14 8.96 82.55 8.36 81.98 7.78C81.18 6.96 80.33 6.1 79.23 5.76C77.49 5.21 75.63 6.08 74.14 7.12C71.4 9.03 69.15 11.64 67.65 14.62C67 15.92 66.24 17.49 64.8 17.67C63.79 17.8 62.72 17.16 61.77 17.55C60.75 17.97 60.51 19.29 59.81 20.14C59.7 20.28 59.56 20.47 59.65 20.62C59.74 20.77 60.02 20.49 59.84 20.47" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M70.47 11.02C71.99 11 73.5 10.67 74.89 10.06C75.17 9.94 75.46 9.8 75.77 9.8C76.45 9.8 76.94 10.52 76.95 11.2C76.96 11.88 76.61 12.5 76.27 13.09C76.02 13.52 75.75 13.95 75.37 14.27C74.42 15.07 73.03 15.01 71.87 15.45C70.83 15.85 69.96 16.68 69.52 17.71C69.47 17.83 69.42 17.96 69.31 18.02C69.21 18.08 69.09 18.07 68.98 18.05C68.2 17.93 67.49 17.41 67.13 16.7" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M51.45 8.75L48.07 8.28C48.22 8.69 48.04 9.16 48.18 9.57C48.28 9.86 48.52 10.08 48.72 10.32C49.05 10.72 49.25 11.21 49.45 11.69C49.81 12.55 50.18 13.49 49.92 14.39C49.76 14.95 49.36 15.52 49.54 16.07C49.77 16.77 50.7 16.87 51.43 16.85" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M44.15 42.37C42.52 41.27 40.67 40.5 38.74 40.11C38.04 39.97 37.26 39.9 36.68 40.31C36.35 40.54 36.13 40.91 35.77 41.09C35.2 41.38 34.35 41.18 34 41.72" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M30.55 44.4C29.59 46.21 29.11 48.27 29.17 50.32C29.21 51.56 29.45 52.84 29.12 54.04C28.18 53.92 27.21 53.98 26.29 54.21C25.84 54.32 25.39 54.47 25.02 54.75C24.64 55.02 24.36 55.4 24.08 55.77C23.01 57.2 21.94 58.63 20.87 60.06" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M53.46 66.8C54.7 67.55 56.04 68.4 56.5 69.78C56.7 70.38 56.71 71.02 56.69 71.65C56.63 73.61 56.29 75.56 55.68 77.43C55.4 78.3 55.03 79.19 54.37 79.82C53.51 80.64 52.26 80.92 51.07 80.98C48.97 81.08 46.85 80.6 45 79.59" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M52.23 72.59L52.96 75.73C52.14 76.44 51.23 77.09 50.18 77.39C49.13 77.69 47.94 77.62 47.05 76.99" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M38.93 80.53L41.62 82.39C43.34 82.1 45.02 81.65 46.65 81.02" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M34.2 80.77C35.1 83.5 36.5 86.56 39.29 87.23C40.21 87.45 41.17 87.37 42.11 87.26C43.3 87.12 44.49 86.95 45.62 86.57C47.85 85.82 49.73 84.32 51.56 82.84C53.53 81.25 55.55 79.61 56.76 77.38C57.45 76.11 58.12 74.48 59.56 74.34C61.07 74.19 62.07 75.83 62.68 77.23C63.11 78.22 63.53 79.2 63.96 80.19C64.2 80.74 64.44 81.3 64.86 81.73C65.32 82.21 65.95 82.48 66.54 82.79C69.24 84.2 71.44 86.55 72.66 89.35C73.63 88.96 74.56 88.36 75.13 87.49C75.7 86.62 75.87 85.42 75.35 84.51C75.03 83.95 74.5 83.55 73.99 83.15C72.34 81.87 70.75 80.46 69.68 78.67C68.06 75.97 67.53 72.32 64.77 70.8C62.29 69.44 59.18 70.53 56.78 72.02" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M75.83 87.79C76.23 88.4 76.77 88.89 77.22 89.46C77.67 90.03 78.05 90.71 78 91.44C77.98 91.8 77.9 92.26 78.22 92.43C78.4 92.53 78.63 92.46 78.82 92.39C79.33 92.21 79.83 92.02 80.34 91.84C80.59 91.75 80.84 91.66 81.1 91.7C81.36 91.74 81.62 91.93 81.62 92.19C81.62 92.36 81.52 92.51 81.42 92.65C81.12 93.07 80.83 93.5 80.53 93.92" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M81.46 92.67C82.53 92.24 83.66 91.93 84.8 91.74C85.06 91.7 85.33 91.66 85.58 91.74C85.83 91.82 86.05 92.05 86.04 92.31C86.04 92.49 85.91 92.65 85.8 92.79C85.45 93.24 85.1 93.69 84.75 94.14C84.63 94.29 84.58 94.6 84.78 94.59" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M85.79 92.65C86.78 92.38 87.77 92.1 88.79 91.98C89.19 91.93 89.61 91.9 90 92.02C90.39 92.14 90.75 92.43 90.84 92.83C89.82 93.06 88.83 93.46 87.93 94" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M90.26 92.64L93.61 93.56C93.36 94.38 92.6 94.96 91.79 95.23C90.98 95.5 90.1 95.5 89.24 95.5C87.44 95.5 85.64 95.5 83.84 95.5C83.35 95.5 82.85 95.5 82.41 95.71C82.07 95.87 81.79 96.14 81.44 96.26C81 96.41 80.52 96.32 80.07 96.22C78.68 95.93 77.3 95.64 75.91 95.35C75.88 96.04 74.84 96.25 74.31 95.8C73.78 95.35 73.67 94.6 73.59 93.92C73.45 92.72 73.3 91.51 73.16 90.31" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M75.67 95.84L76.91 98.55C78.52 98.06 80.25 97.96 81.9 98.28C82.84 98.46 83.76 98.77 84.71 98.81C85.29 98.84 85.87 98.77 86.44 98.68C88.66 98.35 90.84 97.75 92.92 96.9C93.32 96.74 93.75 96.53 93.88 96.12C94.13 95.37 93.19 94.7 93.2 93.91" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M32.78 79.98C29.36 79.03 26.02 77.79 22.81 76.28C21.61 75.71 20.4 75.09 19.49 74.13C17.87 72.42 17.44 69.68 18.47 67.55" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M16.58 51.66C16.81 49.86 16.75 48.02 16.41 46.24C16.25 45.4 15.97 44.49 15.24 44.04C15.06 43.93 14.85 43.86 14.66 43.91C14.44 43.97 14.3 44.17 14.19 44.36C13.47 45.66 13.79 47.31 14.46 48.65C15.13 49.99 16.09 51.16 16.7 52.52C17.62 54.55 17.72 56.93 18.92 58.81C20.05 60.58 22.08 61.8 22.67 63.81C22.96 64.81 22.85 65.88 22.73 66.92C22.62 67.84 22.48 68.81 21.88 69.52C21.28 70.23 20.04 70.45 19.46 69.73C19.18 69.39 19.11 68.93 19.02 68.5C18.52 66.31 17.04 64.5 16.01 62.51C15.32 61.19 14.83 59.78 14.34 58.38C13.22 55.18 12.11 51.99 10.99 48.79C10.64 47.78 10.28 46.76 10.22 45.69C10.17 44.82 10.32 43.95 10.48 43.09C10.75 41.58 11.01 40.08 11.28 38.57C11.32 38.35 11.36 38.12 11.5 37.94C11.82 37.52 12.45 37.58 12.97 37.68C14.38 37.96 15.85 38.26 16.97 39.16C19.2 40.94 19.25 44.26 19.1 47.12C18.94 50.08 18.77 53.08 17.8 55.88" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12.97 56.37C12.41 59.31 9.86001 61.36 7.99001 63.69C6.23001 65.88 5.01001 68.44 3.81001 70.98C3.42001 71.81 3.02001 72.72 3.23001 73.61C3.53001 74.84 4.84001 75.5 6.01001 75.98C7.78001 76.72 9.54001 77.46 11.31 78.19C12.39 78.64 13.56 79.17 14.06 80.22C14.53 81.19 14.29 82.38 13.8 83.34C13.31 84.3 12.58 85.13 12.02 86.05C11.53 86.84 11.16 87.84 11.54 88.69C12.07 89.88 13.83 90.04 14.92 89.33C16.01 88.62 16.6 87.36 17.13 86.17C17.72 84.84 18.31 83.52 18.9 82.19C19.03 81.91 19.16 81.61 19.16 81.3C19.16 80.95 18.99 80.63 18.82 80.33C17.5 78.06 15.31 76.31 12.8 75.53C11.06 74.99 8.88001 74.66 8.19001 72.98C7.81001 72.05 8.06001 70.95 8.57001 70.09C9.08001 69.23 9.84001 68.53 10.55 67.81C12.28 66.07 13.81 64.15 15.12 62.08" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M11.09 88.81C10.48 91.34 10.08 93.91 9.88 96.51C9.87 96.71 9.85 96.92 9.92 97.1C10.08 97.51 10.61 97.68 11.04 97.58C11.47 97.48 11.83 97.18 12.17 96.9C13.63 95.67 15.15 94.47 16.9 93.68C18.65 92.89 20.66 92.57 22.48 93.15C24.14 93.68 25.7 94.94 27.41 94.64C28.13 94.51 28.81 94.1 29.55 94.13C29.84 94.14 30.17 94.2 30.37 94C30.48 93.88 30.51 93.71 30.52 93.54C30.54 92.78 30.18 92.06 29.77 91.42C29.17 90.49 28.35 89.57 27.25 89.43C26.15 89.29 24.92 90.36 25.32 91.39" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M27.07 89.06L24.48 88.66C24.21 88.62 23.93 88.58 23.65 88.6C22.63 88.7 21.9 89.92 22.29 90.87" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M23.61 88.24C22.9 88.46 22.15 88.46 21.41 88.53C20.67 88.6 19.91 88.74 19.31 89.18C18.71 89.62 18.36 90.46 18.66 91.14" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.9 89.07C18.1 89.34 17.32 89.66 16.55 90C16.15 90.18 15.74 90.38 15.51 90.75C15.24 91.17 15.26 91.71 15.29 92.22" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M16.05 88.13C17.26 87.04 18.24 85.68 18.9 84.19C17.23 85.87 16.24 88.2 16.17 90.57C16.19 90.45 16.2 90.34 16.22 90.22" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12.13 96.99C13.42 96.7 14.86 97.22 16.04 96.62C16.57 96.35 16.98 95.88 17.53 95.65C18.25 95.35 19.08 95.53 19.84 95.73C20.6 95.92 21.35 96.12 22.1 96.33C22.7 96.5 23.33 96.69 23.77 97.14C24.21 97.59 24.37 98.38 23.94 98.83C25 99.12 25.95 98.17 26.92 97.65C28.35 96.89 30.08 97.07 31.69 97.27C31.59 96.17 30.95 95.12 30.01 94.54" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M45.19 79.22C44 79.29 42.8 79.26 41.61 79.15" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M57.44 11.95L55.36 14.39C55.7 14.39 55.88 14.94 56.21 14.87C56.33 14.84 56.41 14.74 56.48 14.64C57.01 13.89 57.35 13.01 57.45 12.09" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M40.73 40.69C41.7 39.85 43.17 39.55 43.82 38.44C43.99 38.15 44.1 37.81 44.23 37.5C44.96 35.72 46.65 34.3 46.75 32.38" stroke="#C17084" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>; break;

                        }
                    })()}
</canvas>
            </td>



        </tr>
    );
}



//------------
// start = i * 4;
// let gradient = ctx.createLinearGradient(0, 0, roomCanvas.current.width, roomCanvas.current.height);
// gradient.addColorStop(0.2, "#2392f5");
// gradient.addColorStop(0.5, "#fe0095");
// gradient.addColorStop(1.0, "#e500fe");
// ctx.fillStyle = gradient;
// ctx.fillRect(start, roomCanvas.current.height, bar_width, -songData[i] / 3);
//
//--------


//
//
// let bufferLength =bandVisualizer.current.frequencyBinCount;
// let dataArray = new Uint8Array(bufferLength);
// bandVisualizer.current.getByteTimeDomainData(dataArray);
//
// const ctx = roomCanvas.current.getContext("2d");
//
// let x = 0;
// let barWidth = 15;
// let barHeight =0 ;
// ctx.clearRect(0,0, roomCanvas.current.width, roomCanvas.current.height) ;
// bandVisualizer.current.getByteFrequencyData(dataArray)
// drawVisualizer(bufferLength, x, barWidth, barHeight, dataArray,roomCanvas.current, ctx)
// requestAnimationFrame(drawBandPlayer)





// function drawVisualizer (bufferLength, x, barWidth, barHeight, dataArray,canvas, canvasCtx){
//     for (let i =0 ; i<bufferLength; i++){
//
//         barHeight =dataArray[i] + 1.5;
//
//         // write a method to animate the bar height evaluation
//
//         canvasCtx.save();
//         canvasCtx.translate(canvas.width/2, canvas.height/2)
//         canvasCtx.rotate(Math.PI+dataArray[i])
//
//         canvasCtx.beginPath()
//         canvasCtx.moveTo(0, barHeight)
//         canvasCtx.lineTo(dataArray[i]*50, dataArray[i])
//         canvasCtx.stroke();
//         const hue = i*0.5  ;
//         canvasCtx.fillStyle =  'hsl(' + hue + ', 100%, 50%)' ;
//
//         canvasCtx.fillRect(0,0, barWidth/6, barHeight/4);
//         x+= barWidth;
//         canvasCtx.restore()
//     }
// }







/////----------- backup



// // Visualizations für verschiedene Figuren
// if (props.id===0){ // the keyBoardCase
//     barHeight = songData[i] * 1.5 ;
//     ctx.save();
//     ctx.translate(roomCanvas.current.width/2, roomCanvas.current.height/2)
//     ctx.rotate(i * 4.1)
//     const hue = i*0.3  ;
//
//     ctx.fillStyle =  'hsl(' + hue + ', 100%,' +barHeight/3 +'%)' ;
//     ctx.beginPath();
//     ctx.arc(0,barHeight/2,barHeight/2,0,Math.PI/4);
//     ctx.fill();
//     ctx.stroke();
//     x+= barWidth;
//      // ctx.stroke(v);
//      ctx.restore();
//
//     let selectedSVG = document.getElementById(selectedOption);
//     selectedSVG.style.transform = 'translate(-50%, -50%) scale(' +(1+softVolume ),
//     (softVolume +1) +  ')'
// }
//
// else if (props.id=== 1){
//     barHeight = songData[i] * 2 ;
//     ctx.save();
//     ctx.translate(roomCanvas.width/2, roomCanvas.height/2)
//     ctx.rotate(i * 4.7)
//     const hue = 120+ i*0.7  ;
//
//     ctx.fillStyle =  'hsl(' + hue + ', 100%,' +barHeight/3 +'%)' ;
//     ctx.beginPath();
//     ctx.arc(0,barHeight/2,barHeight/2,0,Math.PI/8);
//     ctx.fill();
//     ctx.stroke();
//     x+= barWidth;
//     ctx.restore();
//
//     let selectedSVG = document.getElementById(selectedOption);
//     selectedSVG.style.transform = 'translate(-50%, -50%) scale(' +(1+softVolume ),
//     (softVolume +1) +  ')'
// }
//
// else if (props.id ===2){
//     barHeight = songData[i] * 2 ;
//     ctx.save();
//     ctx.translate(roomCanvas.width/2, roomCanvas.height/2)
//     ctx.rotate(i * 4.7)
//     const hue = 120+ i*0.7  ;
//
//     ctx.fillStyle =  'hsl(' + hue + ', 100%,' +barHeight/3 +'%)' ;
//     ctx.beginPath();
//     ctx.arc(0,barHeight/2,barHeight/2,0,Math.PI/8);
//     ctx.fill();
//     ctx.stroke();
//     x+= barWidth;
//     ctx.restore();
//
//     let selectedSVG = document.getElementById(selectedOption);
//     selectedSVG.style.transform = 'translate(-50%, -50%) scale(' +(1+softVolume ),
//     (softVolume +1) +  ')'
// }
// else if (props.id===3){
//     barHeight = songData[i] * 2 ;
//     ctx.save();
//     ctx.translate(roomCanvas.width/2, roomCanvas.height/2)
//     ctx.rotate(i * 4.7)
//     const hue = 120+ i*0.7  ;
//
//     ctx.fillStyle =  'hsl(' + hue + ', 100%,' +barHeight/3 +'%)' ;
//     ctx.beginPath();
//     ctx.arc(0,barHeight/2,barHeight/2,0,Math.PI/8);
//     ctx.fill();
//     ctx.stroke();
//     x+= barWidth;
//     ctx.restore();
//
//     let selectedSVG = document.getElementById(selectedOption);
//     selectedSVG.style.transform = 'translate(-50%, -50%) scale(' +(1+softVolume ),
//     (softVolume +1) +  ')'
// }
