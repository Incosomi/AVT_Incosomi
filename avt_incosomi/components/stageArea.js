import Image from "next/image";

export default function StageArea() {
    return (
        <div className="w-full h-full">
            <Image src={"/stage.png"} width={1200} height={2400} alt={"stage"}/>
        </div>
    );
}