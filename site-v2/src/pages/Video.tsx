import { Player } from "@remotion/player";
import { AeriumVideo, AERIUM_VIDEO_DURATION } from "@/remotion/AeriumVideo";
import { IntroductionScene } from "@/remotion/compositions/IntroductionScene";
import { ProblemScene } from "@/remotion/compositions/ProblemScene";
import { SolutionScene } from "@/remotion/compositions/SolutionScene";
import { ObjectiveScene } from "@/remotion/compositions/ObjectiveScene";
import { HowItWorksScene } from "@/remotion/compositions/HowItWorksScene";
import { FeaturesScene } from "@/remotion/compositions/FeaturesScene";
import { TechStackScene } from "@/remotion/compositions/TechStackScene";
import { UseCasesScene } from "@/remotion/compositions/UseCasesScene";
import { ConclusionScene } from "@/remotion/compositions/ConclusionScene";
import { DatabaseSchemaScene } from "@/remotion/compositions/DatabaseSchemaScene";
import { BackendArchitectureScene } from "@/remotion/compositions/BackendArchitectureScene";
import { useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import aeriumLogo from "@/assets/aerium-logo.png";

const compositions = [
  { id: "full", label: "Vidéo Complète", frames: AERIUM_VIDEO_DURATION, component: AeriumVideo },
  { id: "introduction", label: "Introduction", frames: 180, component: IntroductionScene },
  { id: "problem", label: "Le Problème", frames: 150, component: ProblemScene },
  { id: "solution", label: "La Solution", frames: 180, component: SolutionScene },
  { id: "objective", label: "Objectif", frames: 150, component: ObjectiveScene },
  { id: "how-it-works", label: "Fonctionnement", frames: 180, component: HowItWorksScene },
  { id: "features", label: "Fonctionnalités", frames: 150, component: FeaturesScene },
  { id: "database", label: "Base de Données", frames: 180, component: DatabaseSchemaScene },
  { id: "backend", label: "Backend", frames: 180, component: BackendArchitectureScene },
  { id: "tech-stack", label: "Technique", frames: 180, component: TechStackScene },
  { id: "use-cases", label: "Cas d'Usage", frames: 150, component: UseCasesScene },
  { id: "conclusion", label: "Conclusion", frames: 180, component: ConclusionScene },
];

const Video = () => {
  const [activeScene, setActiveScene] = useState("full");
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const currentComposition = compositions.find((c) => c.id === activeScene) || compositions[0];

  const copyExportCommand = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const exportCommands = {
    full: "npx remotion render src/remotion/index.ts AeriumVideo out/aerium-video.mp4",
    scene: `npx remotion render src/remotion/index.ts ${activeScene} out/${activeScene}.mp4`,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={aeriumLogo} alt="Aerium" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-display font-bold text-foreground">Aerium - Présentation Vidéo</h1>
              <p className="text-sm text-muted-foreground">Trophée NSI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-foreground mb-4">Exporter la vidéo en MP4</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Pour exporter votre vidéo, exécutez l'une des commandes suivantes dans votre terminal :
            </p>
            
            <div className="space-y-4">
              {/* Full video export */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Vidéo complète (50s)</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 bg-secondary rounded-lg text-sm text-foreground font-mono overflow-x-auto">
                    {exportCommands.full}
                  </code>
                  <button
                    onClick={() => copyExportCommand(exportCommands.full)}
                    className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {copiedCommand ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Scene export */}
              {activeScene !== "full" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Scène actuelle ({currentComposition.label})</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-secondary rounded-lg text-sm text-foreground font-mono overflow-x-auto">
                      {exportCommands.scene}
                    </code>
                    <button
                      onClick={() => copyExportCommand(exportCommands.scene)}
                      className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {copiedCommand ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Prérequis :</strong> Assurez-vous d'avoir FFmpeg installé sur votre système. 
                La vidéo sera exportée en 1920x1080 à 30fps.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 container mx-auto p-6 flex flex-col gap-6">
        {/* Scene selector */}
        <div className="flex flex-wrap gap-2 justify-center">
          {compositions.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setActiveScene(comp.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeScene === comp.id
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "glass text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {comp.label}
            </button>
          ))}
        </div>

        {/* Video player */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden glow-primary">
            <Player
              key={activeScene}
              component={currentComposition.component}
              durationInFrames={currentComposition.frames}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{
                width: "100%",
                height: "100%",
              }}
              controls
              loop
              autoPlay
            />
          </div>
        </div>

        {/* Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {currentComposition.frames} frames @ 30fps = {(currentComposition.frames / 30).toFixed(1)}s
          </p>
          <p className="text-xs text-muted-foreground/60">
            Exporter en MP4 : <code className="px-2 py-1 bg-secondary rounded">npx remotion render</code>
          </p>
          <p className="text-xs text-muted-foreground/60">
            Projet Aerium - Qualité de l'air IoT | Trophée NSI
          </p>
        </div>
      </main>
    </div>
  );
};

export default Video;
