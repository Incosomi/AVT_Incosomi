import {useState} from "react";
import {Knob} from "primereact/knob";

export default function VolumeKnob({knobSize, onChangeCallback}){
    const [value, setValue] = useState(50);
    const [volume, setVolume] = useState(0);

    const handleChange = (e) => {
        let v = e.value / 50;
        setVolume(v);
        setValue(e.value);
        onChangeCallback(volume);
    }

    return (
        <div className="mx-3 text-center">
            <Knob size={knobSize} className="" value={value} onChange={(e) => handleChange(e)}/>
        </div>
    );
}
