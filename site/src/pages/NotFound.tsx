import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass, Home, Wind } from "lucide-react";
import heroLightImage from "@/assets/landing/hero-light-nature.jpg";
import heroDarkImage from "@/assets/landing/hero-dark-nature.jpg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="landing-theme theme-smooth relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background Images with hero-equivalent light/dark styling */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-100 dark:opacity-0 scale-100 dark:scale-[1.03] blur-0 dark:blur-[4px] brightness-100 dark:brightness-75">
          <img
            src={heroLightImage}
            alt="Paysage naturel"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/35 to-black/10" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 18% 24%, rgba(16, 185, 129, 0.30), transparent 46%), radial-gradient(circle at 85% 72%, rgba(56, 189, 248, 0.18), transparent 36%)"
            }}
          />
          <div
            className="absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "56px 56px"
            }}
          />
        </div>

        <div className="absolute inset-0 overflow-hidden transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-0 dark:opacity-100 scale-[1.03] dark:scale-100 blur-[4px] dark:blur-0 brightness-125 dark:brightness-100">
          <img
            src={heroDarkImage}
            alt="Paysage naturel nocturne"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/80" />
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl"
            animate={{ y: [0, 30, 0], x: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0], x: [0, 20, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <main className="relative z-10 min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center py-12">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-3xl rounded-xl sm:rounded-2xl lg:rounded-[2rem] border border-black/10 dark:border-white/15 bg-white/68 dark:bg-[#0f141c]/55 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-5 sm:p-8 lg:p-10"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 dark:border-emerald-400/25 bg-emerald-100/60 dark:bg-emerald-500/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-manrope">
            <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Navigation interrompue
          </div>

          {/* Main content grid */}
          <div className="mt-6 sm:mt-8 grid gap-6 sm:gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            {/* Left side - Main text */}
            <div>
              <p className="text-foreground/60 uppercase tracking-[0.2em] text-[10px] sm:text-xs font-manrope mb-2 sm:mb-3">
                Erreur 404
              </p>
              
              <h1 className="leading-[0.95] tracking-tight mb-4 sm:mb-5">
                <span className="block text-[clamp(3rem,12vw,7rem)] font-manrope font-semibold text-foreground">
                  404
                </span>
                <span className="block text-[clamp(1.4rem,4vw,2.4rem)] font-editorial italic text-emerald-700 dark:text-emerald-400">
                  Page introuvable.
                </span>
              </h1>

              <p className="text-foreground/75 text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed font-manrope">
                Le chemin{" "}
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold break-all">
                  {location.pathname}
                </span>{" "}
                ne correspond a aucune page active. Revenons a une zone connue de l'experience Aerium.
              </p>
            </div>

            {/* Right side - Tip card */}
            <div className="rounded-xl sm:rounded-2xl border border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400/70 to-cyan-400/60 dark:from-emerald-500/40 dark:to-cyan-500/35 flex items-center justify-center">
                  <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-950 dark:text-emerald-100" />
                </div>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.14em] text-foreground/60 font-manrope font-medium">
                  Conseil rapide
                </p>
              </div>
              <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed font-manrope">
                Verifiez l'URL ou utilisez les actions ci-dessous pour reprendre votre navigation sans perdre le contexte.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <Button asChild size="lg" className="h-11 sm:h-12 px-5 sm:px-6 rounded-full font-manrope text-sm sm:text-base">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Retour a l'accueil
              </Link>
            </Button>
            
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="lg"
              className="h-11 sm:h-12 px-5 sm:px-6 rounded-full border-foreground/15 bg-white/40 hover:bg-white/60 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10 text-foreground font-manrope text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Revenir en arriere
            </Button>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default NotFound;
