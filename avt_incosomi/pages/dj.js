import PlayerArea from "@/components/playerArea";
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';
import StageArea from "@/components/stageArea";

export default function DJTool() {
    return (
        <div className="bg-info/30 w-screen h-screen flex">
            <div className="flex flex-col w-[80%] ml-4">
                <PlayerArea />
            </div>
           {/* <div className="flex my-auto flex-col">
                <StageArea />
            </div>*/}
        </div>
    );
}
