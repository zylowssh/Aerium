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
    <div className="theme-smooth relative min-h-screen overflow-hidden bg-[#eff1f2] dark:bg-[#0f141c]">
      {/* Background Images with smooth light/dark transition */}
      <div className="absolute inset-0">
        {/* Light mode image */}
        <img
          src={heroLightImage}
          alt="Paysage naturel"
          className="absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out opacity-100 dark:opacity-0 scale-100 dark:scale-[1.02]"
          loading="eager"
        />
        {/* Dark mode image */}
        <img
          src={heroDarkImage}
          alt="Paysage naturel nocturne"
          className="absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out opacity-0 dark:opacity-100 scale-[1.02] dark:scale-100"
          loading="eager"
        />
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff1f2]/20 via-[#eff1f2]/30 to-[#eff1f2]/70 dark:from-[#0f141c]/30 dark:via-[#0f141c]/45 dark:to-[#0f141c]/80 transition-colors duration-1000" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 dark:opacity-30" />
        
        {/* Accent glow spots */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/5 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full blur-[100px] opacity-25 dark:opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.5), transparent 70%)' }}
          />
          <div 
            className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] rounded-full blur-[90px] opacity-20 dark:opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(34, 211, 238, 0.5), transparent 70%)' }}
          />
        </div>
      </div>

      <main className="relative z-10 min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center py-12">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-3xl rounded-xl sm:rounded-2xl lg:rounded-[2rem] border border-white/50 dark:border-white/15 bg-white/60 dark:bg-[#0f141c]/50 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-5 sm:p-8 lg:p-10"
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
