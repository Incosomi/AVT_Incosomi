import PlayerBar from "@/components/playerBar";
import {useRef, useState} from "react";
import {PlayIcon, PlusSmallIcon} from "@heroicons/react/24/solid";
import {PauseIcon} from "@heroicons/react/20/solid";

export default function PlayerArea() {
    const [barIds, setBarIds] = useState([]);
    const [lastBarId, setLastBarId] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const masterDuration = useRef(0);
    const masterTimeOffset= useRef(0);

    const audioCtx = useRef(null);

    const handleAddPlayerBar = () => {
        setLastBarId(lastBarId + 1);
        setBarIds([...barIds, lastBarId]);
    };

    const handleDeletePlayerBar = (barId) => {
        setBarIds(barIds.filter((id) => id !== barId));
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
        return masterDuration.current;
    }

    const setMasterTimeOffset = (newMasterTimeOffset) => {
        if(masterTimeOffset.current === 0) masterTimeOffset.current = newMasterTimeOffset;
    }

    const getStartTime = () => {
        let currentTime = audioCtx.current.currentTime;
        return masterDuration.current * (1 + Math.floor((currentTime -  masterTimeOffset.current) / masterDuration.current));
    }

    return (
        <div id="PlayerArea" className="grid grid-rows-1 gap-2">
            <div className="grid grid-cols-9 rounded-md border border-4 border-secondary text-center font-bold py-1 mt-4">
                <div className="col-span-1"></div>
                <div className="col-span-1">Vol</div>
                <div className="col-span-1 ">High</div>
                <div className="col-span-1">Low</div>
                <div className="col-span-5">Waveform</div>
            </div>
            {barIds.map((barId) => (
                <PlayerBar key={barId}
                           id={barId}
                           isPlaying={isPlaying}
                           createAudioCtxHandler={createAudioCtx}
                           getAudioCtxHandler={getAudioCtx}
                           getMasterDurationHandler={getMasterDuration}
                           setMasterDurationHandler={setMasterDuration}
                           getMasterTimeOffsetHandler={getMasterTimeOffset}
                           setMasterTimeOffsetHandler={setMasterTimeOffset}
                           getStartTimeHandler={getStartTime}
                           deleteHandler={() => handleDeletePlayerBar(barId)}/>
            ))}
            <button className="my-1 rounded-full btn btn-success" onClick={handleAddPlayerBar}>
                <PlusSmallIcon className="h-6 w-6" />
            </button>
            <button id="play" className="h-auto btn btn-success" onClick={handlePlayPauseSwitch} >
                {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
            </button>
        </div>
    );
}
