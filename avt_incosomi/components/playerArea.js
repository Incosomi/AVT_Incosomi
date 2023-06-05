import PlayerBar from "@/components/playerBar";
import { useState, useEffect, useRef } from "react";
import { PlusSmallIcon} from "@heroicons/react/24/solid";

export default function PlayerArea() {
    const [barIds, setBarIds] = useState([""]);
    const [lastBarId, setLastBarId] = useState(0);
    const headerRef = useRef();

    const handleAddPlayerBar = () => {
        setLastBarId(lastBarId + 1);
        setBarIds([...barIds, lastBarId]);
    };

    const handleDeletePlayerBar = (barId) => {
        const list = [...barIds];
        let indexToBeRemoved = list.indexOf(barId);
        list.splice(indexToBeRemoved, 1);
        setBarIds(list);
    };

    useEffect(() => {
        const handleScroll = () => {
            const header = headerRef.current;
            const tableRect = header.getBoundingClientRect();

            if (tableRect.top <= 0 && tableRect.bottom >= 0) {
                header.classList.add("sticky", "top-0", "z-10", "bg-white");
            } else {
                header.classList.remove("sticky", "top-0", "z-10", "bg-white");
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <div id="PlayerArea" className="relative">
            <div ref={headerRef}>
                <div className="grid grid-cols-4">
                    <div>Column 1 Header</div>
                    <div>Column 2 Header</div>
                    <div>Column 3 Header</div>
                    <div>Column 4 Header</div>
                </div>
            </div>
            {barIds.map((barId) => (
                <PlayerBar key={barId} deleteHandler={() => handleDeletePlayerBar(barId)} />
            ))}
            <button className="my-1 rounded-full btn btn-success" onClick={handleAddPlayerBar}>
                <PlusSmallIcon className="w-6 h-6"></PlusSmallIcon>
            </button>
        </div>
    );
}
