import PlayerArea from "@/components/playerArea";
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';
import {useEffect, useRef, useState} from "react";

export default function DJTool() {

    const telephoneImpRes_Buffer = useRef(null);
    const springImpRes_Buffer = useRef(null);
    const brightHallImpRes_Buffer = useRef(null);
    const echoImpRes_Buffer = useRef(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchImpulseResponses = async () => {
            telephoneImpRes_Buffer.current = await fetchImpulseResponse('/impulse_responses/telephone_ImpulseResponse.wav');
            springImpRes_Buffer.current = await  fetchImpulseResponse('/impulse_responses/telephone_ImpulseResponse.wav');
            brightHallImpRes_Buffer.current = await  fetchImpulseResponse('/impulse_responses/bright-hall.wav');
            echoImpRes_Buffer.current = await  fetchImpulseResponse('/impulse_responses/echo-chamber.wav');
        }
        fetchImpulseResponses().catch(err => console.log(err));
        setIsLoading(false);
    },[])

    const getTelephoneImpRes_Buffer = () => {
        return telephoneImpRes_Buffer.current;
    }

    const getSpringImpRes_Buffer = () => {
        return springImpRes_Buffer.current;
    }

    const getBrightHallImpRes_Buffer = () => {
        return brightHallImpRes_Buffer.current;
    }

    const getEchoImpRes_Buffer = () => {
        return echoImpRes_Buffer.current;
    }

    const fetchImpulseResponse = async (filepath) => {
        return await fetch(filepath)
            .then(response => response.arrayBuffer())
            .then(buffer => buffer);
    }

    return (
        <>
            {isLoading ? <span className="loading loading-dots loading-lg"></span> :
                <div className="bg-info/30 w-screen h-screen flex">
                    <div className="flex flex-col ml-4">
                        <PlayerArea
                            getTelephoneIRBufferHandler={getTelephoneImpRes_Buffer}
                            getSpringIRBufferHandler={getSpringImpRes_Buffer}
                            getBrightHallIRBufferHandler={getBrightHallImpRes_Buffer}
                            getEchoIRBufferHandler={getEchoImpRes_Buffer}/>
                    </div>
                </div>
            }
        </>
    );
}
