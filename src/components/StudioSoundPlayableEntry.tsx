import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { StudioSound } from "../studio/formats/sounds/StudioSound";
import StudioSoundInstance from "../studio/formats/sounds/StudioSoundInstance";
import { useListenableObject } from "../studio/util/ListenableObject";
import { SVGPause, SVGPlay } from "./Icons";
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


  const src = useMemo(() => isLoaded ? StudioSound.drawVisualization(instance.sound, 'red', visualizerWidth, visualizerHeight) : null, [instance, isLoaded])

  return (
    <div className="flex flex-row w-full mt-4 first:mt-0 bg-blend-normal">
      <div className="flex-grow min-w-0 break-words">{name}</div>
      <div className={"relative flex-shrink-0 ml-2 " + className}>
        {src !== null ?
          <>
            <Image onClick={onClickSeek} alt="Waveform" src={src} objectFit="contain" layout="fill" />
            <PlaybackOverlay instance={instance} />
          </> :
          <div className="text-gray-500">Loading...</div>}
      </div>
      {src !== null &&
        <ButtonWithTooltip tooltip={isPlaying ? "Pause" : "Play"} className="icon-button ml-2" onClick={e => { setIsPlaying(!isPlaying); e.stopPropagation() }}>
          <Icon className="h-5 w-5 -ml-1" />
        </ButtonWithTooltip>}
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

  const src = useMemo(() => StudioSound.drawVisualization(instance.sound, 'green', visualizerWidth, visualizerHeight), [instance])

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