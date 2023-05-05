import { Knob } from 'primereact/knob';
import {useState} from "react";

export default function DJTool(){
    const [value, setValue] = useState(0);

    return (
        <>
            <div className="field col-12 md:col-4">
                <h5>Basic</h5>
                <Knob value={value} onChange={(e) => setValue(e.value)}/>
            </div>        </>
    );
}