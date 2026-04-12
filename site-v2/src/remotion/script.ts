// French script content for Aerium video narration
export const aeriumScript = {
  scenes: [
    {
      id: "introduction",
      title: "Introduction",
      text: "Et si nous pouvions voir l'air que nous respirons ? La qualité de l'air influence notre santé, notre environnement, et notre quotidien. Pourtant, ces données restent souvent invisibles, complexes, ou inaccessibles.",
      durationInFrames: 180, // 6 seconds
    },
    {
      id: "problem",
      title: "Le Problème",
      text: "Les stations de mesure officielles sont peu nombreuses. Les données sont difficiles à consulter et rarement en temps réel. Il manque un outil simple, local, et compréhensible par tous.",
      durationInFrames: 150, // 5 seconds
    },
    {
      id: "solution",
      title: "La Solution : Aerium",
      text: "C'est pour répondre à ce problème que nous avons créé Aerium. Aerium est un système permettant de collecter, traiter et visualiser des données de qualité de l'air, de manière claire et accessible.",
      durationInFrames: 180, // 6 seconds
    },
    {
      id: "objective",
      title: "Objectif du Projet",
      text: "Rendre visibles des données invisibles. Permettre à chacun de comprendre l'environnement qui l'entoure. Proposer une solution open-source, modulaire et évolutive.",
      durationInFrames: 150, // 5 seconds
    },
    {
      id: "how-it-works",
      title: "Comment ça fonctionne",
      text: "Des capteurs mesurent la qualité de l'air. Les données sont envoyées vers un serveur. Elles sont traitées, stockées, puis affichées en temps réel sur une interface claire.",
      durationInFrames: 180, // 6 seconds
    },
    {
      id: "features",
      title: "Fonctionnalités",
      text: "Visualisation des mesures en temps réel. Historique et évolution des données. Comparaison entre différents lieux. Interface simple, intuitive et interactive.",
      durationInFrames: 150, // 5 seconds
    },
    {
      id: "tech-stack",
      title: "Architecture Technique",
      text: "Pour faire fonctionner Aerium, nous avons conçu une architecture complète. Un système capable de recevoir des données de capteurs. Un traitement en temps réel pour analyser ces informations. Un stockage structuré pour conserver l'historique. Et une interface claire pour rendre ces données lisibles instantanément. Chaque élément communique pour transformer des mesures brutes en informations compréhensibles.",
      durationInFrames: 180, // 6 seconds
    },
    {
      id: "use-cases",
      title: "Intérêt du Projet",
      text: "Aerium peut être utilisé par des élèves, pour comprendre les enjeux environnementaux, des citoyens, pour connaître la qualité de l'air autour d'eux, des établissements, pour surveiller leur environnement.",
      durationInFrames: 150, // 5 seconds
    },
    {
      id: "conclusion",
      title: "Conclusion",
      text: "Aerium, c'est rendre l'invisible visible. Comprendre l'air que l'on respire, grâce à la technologie. Un projet réalisé dans le cadre de la NSI et présenté au Trophée NSI.",
      durationInFrames: 180, // 6 seconds
    },
  ],
  totalDurationInFrames: 1500, // ~50 seconds at 30fps
};

export type SceneData = typeof aeriumScript.scenes[number];
