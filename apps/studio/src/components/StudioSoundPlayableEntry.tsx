import { SVGPause, SVGPlay } from "@dumbcode/shared/icons";
import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { StudioSound } from "../studio/formats/sounds/StudioSound";
import StudioSoundInstance from "../studio/formats/sounds/StudioSoundInstance";
import { useListenableObject } from "../studio/listenableobject/ListenableObject";
import { ButtonWithTooltip } from "./Tooltips";

const visualizerWidth = 200
const visualizerHeight = 30

const className = "w-[200px] h-[30px]"

const StudioSoundPlayableEntry = ({ sound }: { sound: StudioSound; }) => {
  const [name] = useListenableObject(sound.name);

  const instance = useMemo(() => new StudioSoundInstance(sound), [sound]);
  useEffect(() => () => instance.dispose(), [instance]);

  const [isPlaying, setIsPlaying] = useListenableObject(instance.playing);

  const Icon = isPlaying ? SVGPause : SVGPlay;
  const [isLoaded] = useListenableObject(instance.sound.isLoaded);


  const onClickSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    instance.seek(percent * instance.sound.duration);
  };


  const src = useMemo(() => isLoaded ? StudioSound.drawVisualization(instance.sound, 'black', visualizerWidth, visualizerHeight) : null, [instance, isLoaded])

  const iconButtonClass = "bg-orange-700 hover:bg-orange-800 rounded pr-1 pl-2 py-0.5 my-0.5 mr-1"

  return (
    <div className="bg-orange-600 hover:bg-orange-500 w-full first:mt-0 bg-blend-normal mb-2 rounded-sm h-8 text-left pl-2 flex flex-row ml-2 pr-4 cursor-pointer">
      <div className="flex-grow min-w-0 break-words pt-1 text-black">{name}</div>
      {src !== null &&
        <ButtonWithTooltip tooltip={isPlaying ? "Pause" : "Play"} className={iconButtonClass} onClick={e => { setIsPlaying(!isPlaying); e.stopPropagation() }}>
          <Icon className="h-5 w-5 -ml-1" />
        </ButtonWithTooltip>}
      <div className={"relative flex-shrink-0 ml-2 " + className}>
        {src !== null ?
          <>
            <Image onClick={onClickSeek} alt="Waveform" src={src} objectFit="contain" layout="fill" />
            <PlaybackOverlay instance={instance} />
          </> :
          <div className="text-gray-500">Loading...</div>}
      </div>
    </div>
  );
};
const PlaybackOverlay = ({ instance }: { instance: StudioSoundInstance; }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [playing] = useListenableObject(instance.playing);
  useEffect(() => {
    const el = ref.current;
    if (el === null) {
      return;
    }

    let requestId = -1;
    const onFrame = () => {
      requestId = requestAnimationFrame(onFrame);
      const position = instance.getPlaybackPosition();
      const percent = position / instance.sound.duration;
      el.style.clipPath = `inset(0 ${(1 - percent) * 100}% 0 0)`;
    };
    onFrame();
    return () => {
      if (requestId !== -1) {
        cancelAnimationFrame(requestId);
      }
    };
  }, [instance, playing]);

  const src = useMemo(() => StudioSound.drawVisualization(instance.sound, 'white', visualizerWidth, visualizerHeight), [instance])

  return (
    <div ref={ref} className="absolute left-0 top-0 w-full h-full pointer-events-none ">
      <Image
        src={src}
        alt="Waveform"
        objectFit="contain" layout="fill"
      />
    </div>

  );
};

export default StudioSoundPlayableEntry