import KnobComponent from "@/components/knob";

export default function TrackComponent(){
    return (
        <div className="flex">
            <KnobComponent text="TREBBLE"></KnobComponent>
            <KnobComponent text="MID"></KnobComponent>
            <KnobComponent text="BASS"></KnobComponent>
        </div>
    );
}
