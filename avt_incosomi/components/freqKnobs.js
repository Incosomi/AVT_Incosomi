import KnobComponent from "@/components/knob";

export default function FreqKnobsComponent({knobSize}){
    return (
        <div className="">
            <td><KnobComponent id="high" knobSize={knobSize} text="TREBBLE"></KnobComponent></td>
            <td><KnobComponent id="mid" knobSize={knobSize} text="MID"></KnobComponent></td>
            <td><KnobComponent id="low" knobSize={knobSize} text="BASS"></KnobComponent></td>
        </div>
    );
}
