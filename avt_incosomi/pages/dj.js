import PlayerArea from "@/components/playerArea";
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';
import {useState} from "react";

export default function DJTool() {
    const [childData, setChildData] = useState('');

    const handleChildData = (data) => {setChildData(data)}

    return (
        <div className="bg-info/30 w-screen h-screen">
            <PlayerArea/>
        </div>
    );
}
