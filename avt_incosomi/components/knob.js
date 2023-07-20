import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';

import {Knob} from 'primereact/knob';
import {useState} from "react";

export default function KnobComponent({text}){
    const [value, setValue] = useState(50);


    return (
        <div className="mx-auto text-center">
            <h5 className="font-bold ">{text}</h5>
            <Knob className="" value={value} onChange={(e) => setValue(e.value)}/>
        </div>
    );
}