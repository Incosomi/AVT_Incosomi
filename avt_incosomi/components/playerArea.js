import PlayerBar from "@/components/playerBar";
import {useState} from "react";
import {PlusSmallIcon} from "@heroicons/react/24/solid";


export default function PlayerArea() {
    const [barIds, setBarIds] = useState([]);
    const [lastBarId, setLastBarId] = useState(0);

    const handleAddPlayerBar = () => {
        setLastBarId(lastBarId + 1);
        setBarIds([...barIds, lastBarId]);
    };

    const handleDeletePlayerBar = (barId) => {
        setBarIds(barIds.filter((id) => id !== barId));
    };

    return (
        <div id="PlayerArea" className="grid grid-rows-1 gap-2 w-1/3">
            <div className="grid grid-cols-9 text-center font-bold">
                <div className="col-span-1"></div>
                <div className="col-span-1">Vol</div>
                <div className="col-span-1">High</div>
                <div className="col-span-1">Low</div>
                <div className="col-span-5">Waveform</div>
            </div>
            {barIds.map((barId) => (
                <PlayerBar
                    key={barId}
                    id={barId}
                    deleteHandler={() => handleDeletePlayerBar(barId)}
                />
            ))}
            <button
                className="my-1 rounded-full btn btn-success"
                onClick={handleAddPlayerBar}
            >
                <PlusSmallIcon className="h-6 w-6" />
            </button>
        </div>
    );
}
