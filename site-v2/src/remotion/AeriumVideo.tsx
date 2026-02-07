import { Sequence, AbsoluteFill } from "remotion";
import { IntroductionScene } from "./compositions/IntroductionScene";
import { ProblemScene } from "./compositions/ProblemScene";
import { SolutionScene } from "./compositions/SolutionScene";
import { ObjectiveScene } from "./compositions/ObjectiveScene";
import { HowItWorksScene } from "./compositions/HowItWorksScene";
import { FeaturesScene } from "./compositions/FeaturesScene";
import { TechStackScene } from "./compositions/TechStackScene";
import { UseCasesScene } from "./compositions/UseCasesScene";
import { ConclusionScene } from "./compositions/ConclusionScene";
import { DatabaseSchemaScene } from "./compositions/DatabaseSchemaScene";
import { BackendArchitectureScene } from "./compositions/BackendArchitectureScene";

// Total duration: 1860 frames = 62 seconds at 30fps (added 2 new scenes)
export const AERIUM_VIDEO_DURATION = 1860;

// Main video composition that combines all scenes following the Aerium script
export const AeriumVideo: React.FC = () => {
  let currentFrame = 0;

  const scenes = [
    { Component: IntroductionScene, frames: 180 },
    { Component: ProblemScene, frames: 150 },
    { Component: SolutionScene, frames: 180 },
    { Component: ObjectiveScene, frames: 150 },
    { Component: HowItWorksScene, frames: 180 },
    { Component: FeaturesScene, frames: 150 },
    { Component: DatabaseSchemaScene, frames: 180 },
    { Component: BackendArchitectureScene, frames: 180 },
    { Component: TechStackScene, frames: 180 },
    { Component: UseCasesScene, frames: 150 },
    { Component: ConclusionScene, frames: 180 },
  ];

  return (
    <AbsoluteFill>
      {/* Video scenes */}
      {scenes.map(({ Component, frames }, index) => {
        const from = currentFrame;
        currentFrame += frames;
        return (
          <Sequence key={index} from={from} durationInFrames={frames}>
            <Component />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
