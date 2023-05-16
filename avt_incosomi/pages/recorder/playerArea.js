import PlayerBar from "@/pages/recorder/playerBar";
import {useState} from "react";

export default function PlayerArea(){

    const [barIds, setBarIds] = useState([""]);
    const [lastBarId, setLastBarId] = useState(0);
    const handleAddPlayerBar = () => {
        setLastBarId(lastBarId+1);
        setBarIds([...barIds,lastBarId]);
    }

    const handleDeletePlayerBar = (barId) => {
        const list = [...barIds];
        let indexToBeRemoved = list.indexOf(barId);
        list.splice(indexToBeRemoved, 1);
        setBarIds(list);
    }

    return(
        <div id="PlayerArea" className="w-3/12">
            {barIds.map(barId => (
                <PlayerBar key={barId} deleteHandler={() => handleDeletePlayerBar(barId)}/>
            ))}
            <button className="btn my-1 btn-secondary rounded-full" onClick={handleAddPlayerBar}>+</button>
        </div>
    );
}
