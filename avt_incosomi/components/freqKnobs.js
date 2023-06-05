import KnobComponent from "@/components/knob";

export default function FreqKnobsComponent({knobSize}){
    return (
        <div className="my-auto flex">
            <KnobComponent knobSize={knobSize} text="TREBBLE"></KnobComponent>
            <KnobComponent knobSize={knobSize} text="MID"></KnobComponent>
            <KnobComponent knobSize={knobSize} text="BASS"></KnobComponent>
        </div>
    );
}
