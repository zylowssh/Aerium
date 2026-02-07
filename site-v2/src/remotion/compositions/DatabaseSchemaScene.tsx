import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Database, Key, Shield, Table2 } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const tables = [
  {
    name: "profiles",
    icon: "👤",
    color: "hsl(165, 70%, 55%)",
    columns: ["id", "user_id", "full_name", "email", "avatar_url"],
  },
  {
    name: "sensors",
    icon: "📡",
    color: "hsl(190, 80%, 50%)",
    columns: ["id", "name", "location", "sensor_type", "status", "battery"],
  },
  {
    name: "sensor_readings",
    icon: "📊",
    color: "hsl(220, 60%, 55%)",
    columns: ["id", "sensor_id", "co2", "temperature", "humidity", "recorded_at"],
  },
  {
    name: "user_roles",
    icon: "🔐",
    color: "hsl(260, 60%, 55%)",
    columns: ["id", "user_id", "role (admin | user)"],
  },
];

export const DatabaseSchemaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const rlsOpacity = interpolate(frame, [120, 140], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="default" particleCount={15} />

      {/* Grid pattern background */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.03,
        }}
      >
        {[...Array(20)].map((_, i) => (
          <g key={i}>
            <line
              x1="0"
              y1={i * 60}
              x2="1920"
              y2={i * 60}
              stroke="hsl(165, 70%, 55%)"
              strokeWidth="1"
            />
            <line
              x1={i * 100}
              y1="0"
              x2={i * 100}
              y2="1080"
              stroke="hsl(165, 70%, 55%)"
              strokeWidth="1"
            />
          </g>
        ))}
      </svg>

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          padding: 50,
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: "center",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Database size={36} color="hsl(165, 70%, 55%)" />
            <h2 style={{ fontSize: 48, fontWeight: 700, margin: 0 }}>
              <span style={{ color: "hsl(210, 40%, 98%)" }}>Schéma </span>
              <span
                style={{
                  background: "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Base de Données
              </span>
            </h2>
          </div>
          <p
            style={{
              fontSize: 20,
              color: "hsl(215, 20%, 60%)",
              margin: 0,
              marginTop: 10,
              opacity: subtitleOpacity,
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
            gap: 20,
          }}
        >
          {tables.map((table, index) => {
            const delay = 45 + index * 12;
            const scale = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 100 },
            });
            const opacity = interpolate(frame - delay, [0, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const yOffset = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12, stiffness: 80 },
            });

            return (
              <div
                key={table.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 16,
                  background: "hsla(220, 20%, 8%, 0.95)",
                  border: `1px solid ${table.color}40`,
                  backdropFilter: "blur(20px)",
                  transform: `scale(${scale}) translateY(${(1 - yOffset) * 20}px)`,
                  opacity,
                  overflow: "hidden",
                  boxShadow: `
                    0 0 25px ${table.color}15,
                    0 15px 45px -15px hsla(220, 30%, 0%, 0.6)
                  `,
                }}
              >
                {/* Table header */}
                <div
                  style={{
                    background: `${table.color}20`,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderBottom: `1px solid ${table.color}30`,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{table.icon}</span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: table.color,
                      fontFamily: "monospace",
                    }}
                  >
                    {table.name}
                  </span>
                </div>

                {/* Columns */}
                <div style={{ padding: "12px 16px" }}>
                  {table.columns.map((col, i) => (
                    <div
                      key={col}
                      style={{
                        fontSize: 12,
                        color: i === 0 ? "hsl(45, 90%, 55%)" : "hsl(215, 20%, 65%)",
                        fontFamily: "monospace",
                        padding: "4px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {i === 0 && <Key size={10} color="hsl(45, 90%, 55%)" />}
                      {col}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Database info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 28px",
            borderRadius: 12,
            background: "hsla(165, 70%, 55%, 0.1)",
            border: "1px solid hsla(165, 70%, 55%, 0.3)",
            opacity: rlsOpacity,
          }}
        >
          <Shield size={24} color="hsl(165, 70%, 55%)" />
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "hsl(165, 70%, 55%)", margin: 0 }}>
              Données Persistantes
            </p>
            <p style={{ fontSize: 13, color: "hsl(215, 20%, 65%)", margin: "4px 0 0 0" }}>
              Stockage SQLite avec relations entre tables — Requêtes optimisées avec SQLAlchemy ORM
            </p>
          </div>
        </div>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="in" />
    </AbsoluteFill>
  );
};
