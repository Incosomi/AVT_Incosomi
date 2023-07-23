import PlayerBar from "@/components/playerBar";
import {useState, useEffect, useRef} from "react";
import {PlusSmallIcon} from "@heroicons/react/24/solid";
//import PlayerVisualizer from "@/components/playerVisualizer";

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

    return (<div id="PlayerArea">
        <table className="table-auto border-collapse border border-slate-500">
            <thead>
            <tr>
                <th>Waveform</th>
                <th>Import</th>
                <th>Play</th>
                <th>Delete</th>
                <th>High</th>
                <th>Mid</th>
                <th>Low</th>
                <th>Vol</th>
                <th>Stage</th>
            </tr>
            </thead>
            <tbody>
            {barIds.map((barId) => (
                    <PlayerBar key={barId} id={barId} deleteHandler={() => handleDeletePlayerBar(barId)}/>

            ))}
            </tbody>
        </table>

        <button className="my-1 rounded-full btn btn-success" onClick={handleAddPlayerBar}>
            <PlusSmallIcon className="h-6 w-6"/>
        </button>
    </div>);
}
