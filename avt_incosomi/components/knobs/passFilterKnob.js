import {useState} from "react";
import {Knob} from "primereact/knob";

export default function PassFilterKnob({text, onChangeCallback}){
    const [value, setValue] = useState(50);
    const [frequency, setFrequency] = useState(0);

    const handleChange = (e) => {
        let f = e.value * 100;
        setFrequency(f);
        setValue(e.value);
        onChangeCallback(frequency);
    }

    return (
        <div className="mx-3 text-center">
            <h5 className="font-bold ">{text}</h5>
            <Knob size={32} className="" value={value} onChange={(e) => handleChange(e)}/>
        </div>
    );
}
