import KnobComponent from "@/components/knob";

export default function TrackComponent(){
    return (
        <div className="grid grid-cols-3">
            <KnobComponent text="TREBBLE"></KnobComponent>
            <KnobComponent text="MID"></KnobComponent>
            <KnobComponent text="BASS"></KnobComponent>
        </div>
    );
}