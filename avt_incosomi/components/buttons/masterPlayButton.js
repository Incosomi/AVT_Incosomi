import {PlayIcon} from "@heroicons/react/24/solid";

export default function MasterPlayButton(){
    return (
        <div className="flex flex-grow flex-col items-center">
            <div className="btn btn-success h-full w-20">
                <PlayIcon></PlayIcon>
            </div>
        </div>
    );
}