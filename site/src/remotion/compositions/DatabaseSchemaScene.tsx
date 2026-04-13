import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Database, Key } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const tables = [
  {
    name: "profiles",
    columns: ["id", "user_id", "full_name", "email"],
  },
  {
    name: "sensors",
    columns: ["id", "name", "location", "status"],
  },
  {
    name: "sensor_readings",
    columns: ["id", "sensor_id", "co2", "temperature"],
  },
  {
    name: "user_roles",
    columns: ["id", "user_id", "role"],
  },
];

export const DatabaseSchemaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const accentColor = "#10b981";

  // Info badge animation
  const infoOpacity = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}>
      <AnimatedBackground variant="cool" />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginBottom: 48,
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [25, 0])}px)`,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: accentColor,
            }}
          >
            Données
          </span>
          <h2
            style={{
              fontSize: 48,
              fontWeight: 600,
              margin: 0,
              color: "#fafafa",
              letterSpacing: "-0.02em",
            }}
          >
            Schéma Base de Données
          </h2>
          <p
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: "rgba(250, 250, 250, 0.5)",
              margin: "4px 0 0 0",
              opacity: interpolate(titleSpring, [0.5, 1], [0, 1], { extrapolateLeft: "clamp" }),
            }}
          >
            SQLite — Stockage local efficace et relationnel
          </p>
        </div>

        {/* Tables grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {tables.map((table, index) => {
            const delay = 45 + index * 12;
            
            const cardSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, stiffness: 100 },
            });

            return (
              <div
                key={table.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 12,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  overflow: "hidden",
                  opacity: cardSpring,
                  transform: `translateY(${interpolate(cardSpring, [0, 1], [25, 0])}px)`,
                }}
              >
                {/* Table header */}
                <div
                  style={{
                    backgroundColor: `${accentColor}12`,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <Database size={14} color={accentColor} strokeWidth={1.5} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: accentColor,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {table.name}
                  </span>
                </div>

                {/* Columns */}
                <div style={{ padding: "10px 14px" }}>
                  {table.columns.map((col, i) => (
                    <div
                      key={col}
                      style={{
                        fontSize: 11,
                        color: i === 0 ? "#eab308" : "rgba(250, 250, 250, 0.5)",
                        fontFamily: "'JetBrains Mono', monospace",
                        padding: "3px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {i === 0 && <Key size={9} color="#eab308" strokeWidth={2} />}
                      {col}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 24px",
            borderRadius: 10,
            backgroundColor: `${accentColor}08`,
            border: `1px solid ${accentColor}20`,
            marginTop: 40,
            opacity: infoOpacity,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(250, 250, 250, 0.7)",
            }}
          >
            Stockage SQLite avec SQLAlchemy ORM
          </span>
        </div>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="both" />
    </AbsoluteFill>
  );
};
