import PlayerBar from "@/components/playerBar";
import {useEffect, useRef, useState} from "react";
import {PlayIcon} from "@heroicons/react/24/solid";
import {PauseIcon} from "@heroicons/react/20/solid";
import Image from "next/image";

export default function PlayerArea({    getTelephoneIRBufferHandler,
                                        getSpringIRBufferHandler,
                                        getBrightHallIRBufferHandler,
                                       getEchoIRBufferHandler}) {
    const [barIds, setBarIds] = useState([]);
    const [lastBarId, setLastBarId] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const masterDuration = useRef(0);
    const masterTimeOffset= useRef(0);

    const audioCtx = useRef(null);

    useEffect(() => {
        handleAddPlayerBar();
    },[]);

    const handleAddPlayerBar = () => {
        setLastBarId(lastBarId + 1);
        setBarIds([...barIds, lastBarId]);
    };

    const handleDeletePlayerBar = (barId) => {
        setBarIds(barIds.filter((id) => id !== barId));
        if(barIds.length === 2){
            masterDuration.current = 0;
            masterTimeOffset.current = 0;
        }
    };

    const handlePlayPauseSwitch = () => {
        setIsPlaying(!isPlaying);
    }

    const createAudioCtx = () => {
        if(audioCtx.current === null) audioCtx.current = new AudioContext();
    }

    const getAudioCtx = () => {
        return audioCtx.current;
    }

    const getMasterDuration = () => {
        return masterDuration.current;
    }

    const setMasterDuration = (newMasterDuration) => {
        if(masterDuration.current === 0) masterDuration.current = newMasterDuration;
    }

    const getMasterTimeOffset = () => {
        return masterTimeOffset.current;
    }

    const setMasterTimeOffset = (newMasterTimeOffset) => {
        if(masterTimeOffset.current === 0) masterTimeOffset.current = newMasterTimeOffset;
    }

    const getStartTime = () => {
        let currentTime = audioCtx.current.currentTime;
        return masterDuration.current * (1 + Math.floor((currentTime -  masterTimeOffset.current) / masterDuration.current));
    }

    return (
        <div id="PlayerArea" className="grid grid-rows-1">
            <div className="grid grid-cols-4">
                <div className="flex items-center col-span-2 grid grid-cols-8 rounded-md border-2 border-black text-center font-bold py-1 mt-1">
                    <div className=""></div>
                    <div className="">Vol</div>
                    <div className="">Reverb</div>
                    <div className="col-span-4">Waveform</div>
                    <div className="">Avatar</div>
                </div>
                <div className="flex flex-row">
                    <Image src={"/spotlight_tile_600w.png"} alt="background" width={150} height={50}/>
                    <Image src={"/spotlight_tile_600w.png"} alt="background" width={150} height={50}/>
                    <Image src={"/spotlight_tile_600w.png"} alt="background" width={150} height={50}/>
                    <Image src={"/spotlight_tile_600w.png"} alt="background" width={150} height={50}/>
                    <Image src={"/spotlight_tile_600w.png"} alt="background" width={150} height={50}/>
                    <Image src={"/spotlight_tile_600w.png"} alt="background" width={150} height={50}/>
                </div>
            </div>
            <div className="flex flex-col justify-center">
                {barIds.map((barId) => (
                    <PlayerBar key={barId}
                               id={barId}
                               isPlaying={isPlaying}
                               createAudioCtxHandler={createAudioCtx}
                               getAudioCtxHandler={getAudioCtx}
                               getTelphoneIRBufferHandler={getTelephoneIRBufferHandler}
                               getSpringIRBufferHandler={getSpringIRBufferHandler}
                               getBrightHallIRBufferHandler={getBrightHallIRBufferHandler}
                               getEchoIRBufferHandler={getEchoIRBufferHandler}
                               getMasterDurationHandler={getMasterDuration}
                               setMasterDurationHandler={setMasterDuration}
                               getMasterTimeOffsetHandler={getMasterTimeOffset}
                               setMasterTimeOffsetHandler={setMasterTimeOffset}
                               getStartTimeHandler={getStartTime}
                               addPlayerBarHandler={handleAddPlayerBar}
                               deleteHandler={() => handleDeletePlayerBar(barId)}/>
                ))}
                <div className="flex justify-center">
                    <button id="play" className="h-auto btn btn-success w-72 mt-4" onClick={handlePlayPauseSwitch} >
                        {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                    </button>
                </div>

            </div>

        </div>
    );
}
