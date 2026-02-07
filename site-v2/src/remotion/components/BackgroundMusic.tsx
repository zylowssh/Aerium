import { Audio, staticFile, useCurrentFrame, interpolate } from "remotion";

interface BackgroundMusicProps {
  src?: string;
  volume?: number;
  startFrom?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  totalDuration?: number;
}

/**
 * Background music component for Remotion videos.
 * 
 * To use with your own music:
 * 1. Add an MP3 file to the public/ folder (e.g., public/music/background.mp3)
 * 2. Use: <BackgroundMusic src="music/background.mp3" />
 * 
 * The music will automatically fade in and out.
 */
export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  src,
  volume = 0.3,
  startFrom = 0,
  fadeInDuration = 60, // 2 seconds at 30fps
  fadeOutDuration = 90, // 3 seconds at 30fps
  totalDuration = 1500,
}) => {
  const frame = useCurrentFrame();

  // Calculate volume with fade in/out
  const fadeInVolume = interpolate(frame, [0, fadeInDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOutVolume = interpolate(
    frame,
    [totalDuration - fadeOutDuration, totalDuration],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const currentVolume = volume * fadeInVolume * fadeOutVolume;

  // If no source provided, render nothing (allows for placeholder usage)
  if (!src) {
    return null;
  }

  return (
    <Audio
      src={staticFile(src)}
      volume={currentVolume}
      startFrom={startFrom}
    />
  );
};

/**
 * Placeholder component that shows music is ready to be added.
 * Replace with actual BackgroundMusic component when you have an audio file.
 */
export const MusicPlaceholder: React.FC = () => {
  // This component renders nothing - it's just a marker
  // When you have a music file:
  // 1. Add it to public/music/background.mp3
  // 2. Replace <MusicPlaceholder /> with <BackgroundMusic src="music/background.mp3" />
  return null;
};
