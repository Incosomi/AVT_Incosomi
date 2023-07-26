import {useRef} from "react";

export default function ReverbDropdown({changeReverbHandler}){

    const activeReverb = useRef(null);

    const reverbTypes = [
        {id: "0", type:"None"},
        {id: "1", type:"Simple"},
        {id: "2", type:"Telephone"},
        {id: "3", type:"Spring"},
        {id: "4", type:"BrightHall"},
        {id: "5", type:"Echo"}
    ];

    const handleClick = (type) => {
        changeReverbHandler(type);
        activeReverb.current = type;
    }

    return (
        <div className="dropdown dropdown-hover mb-32">
            <label className="m-1 btn">{activeReverb.current? activeReverb.current : "Reverb"}</label>
            <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-35">
                {reverbTypes.map(function (reverbType){
                    return(<li key={reverbType.id}><a onClick={() => handleClick(reverbType.type)}>{reverbType.type}</a></li>);
                })}
            </ul>
        </div>
    );
}
