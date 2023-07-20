import PlayerArea from "@/components/playerArea";
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';
import StageArea from "@/components/stageArea";
import MasterPlayButton from "@/components/masterPlayButton";

export default function DJTool() {
    return (
        <div className="bg-info/30 w-screen h-screen flex">
            <div className="flex flex-col w-[33%] ml-4">
                <PlayerArea />
            </div>
            <div className="mx-4 my-16 flex flex-col">
                <MasterPlayButton></MasterPlayButton>
            </div>
            <div className="flex my-auto flex-col">
                <StageArea />
            </div>
        </div>
    );
}