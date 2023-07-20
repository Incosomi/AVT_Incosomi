import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';

import {Knob} from 'primereact/knob';
import {useState} from "react";

export default function KnobComponent({ text, knobSize }) {
    const [value, setValue] = useState(50);

    return (
        <div className="mx-auto text-center">
            <Knob className="" value={value} size={knobSize} onChange={({ value }) => setValue(value)} />
        </div>
    );
}
