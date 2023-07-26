import { useState } from "react";

export default function ReverbDropdown({ changeReverbHandler }) {
    const [activeReverb, setActiveReverb] = useState("None");

    const reverbTypes = [
        { value: "None", label: "None" },
        { value: "Simple", label: "Simple" },
        { value: "Telephone", label: "Telephone" },
        { value: "Spring", label: "Spring" },
        { value: "BrightHall", label: "BrightHall" },
        { value: "Echo", label: "Echo" },
    ];

    const handleChange = (event) => {
        const selectedReverb = event.target.value;
        changeReverbHandler(selectedReverb);
        setActiveReverb(selectedReverb);
    };

    return (
        <div className="flex flex-col justify-center">
            <select className="select hover:border-black" value={activeReverb} onChange={handleChange}>
                {reverbTypes.map((reverbType) => (
                    <option key={reverbType.value} value={reverbType.value}>
                        {reverbType.label}
                    </option>
                ))}
            </select>
        </div>
    );
}