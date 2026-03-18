import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass, Home, Wind } from "lucide-react";
import heroLightImage from "@/assets/landing/hero-light-nature.jpg";
import footerDarkImage from "@/assets/landing/footer-dark.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eff1f2] dark:bg-[#0f141c]">
      <div className="absolute inset-0">
        <img
          src={heroLightImage}
          alt="Paysage naturel"
          className="absolute inset-0 h-full w-full object-cover opacity-92 dark:opacity-0 transition-opacity duration-[1400ms]"
          loading="eager"
        />
        <img
          src={footerDarkImage}
          alt="Paysage naturel nocturne"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-0 dark:opacity-88 transition-opacity duration-[1400ms]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff1f2]/30 via-[#eff1f2]/40 to-[#eff1f2]/72 dark:from-black/38 dark:via-black/48 dark:to-black/72" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.09)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[size:58px_58px] opacity-20" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 18% 24%, rgba(16, 185, 129, 0.22), transparent 42%), radial-gradient(circle at 82% 76%, rgba(56, 189, 248, 0.20), transparent 38%)" }} />
      </div>

      <main className="relative z-10 min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="w-full max-w-4xl rounded-[2rem] border border-black/10 dark:border-white/20 bg-white/65 dark:bg-black/35 backdrop-blur-2xl shadow-[0_30px_90px_-34px_rgba(2,8,23,0.45)] dark:shadow-[0_30px_90px_-34px_rgba(2,8,23,0.85)] p-6 sm:p-8 lg:p-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/45 dark:border-emerald-300/35 bg-emerald-200/55 dark:bg-emerald-400/15 px-4 py-2 text-sm text-emerald-900 dark:text-emerald-100 font-manrope">
            <Compass className="h-4 w-4" />
            Navigation interrompue
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-foreground/65 uppercase tracking-[0.2em] text-xs sm:text-sm font-manrope mb-3">Erreur 404</p>
              <h1 className="leading-[0.9] tracking-tight mb-5">
                <span className="block text-[clamp(4rem,16vw,8.5rem)] font-manrope font-semibold text-foreground">404</span>
                <span className="block text-[clamp(1.7rem,4vw,2.9rem)] font-editorial italic text-emerald-700/95 dark:text-emerald-300/90">Page introuvable.</span>
              </h1>

              <p className="text-foreground/80 text-base sm:text-lg max-w-xl leading-relaxed font-manrope">
                Le chemin <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{location.pathname}</span> ne correspond a aucune page active.
                Revenons a une zone connue de l'experience Aerium.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 dark:border-white/20 bg-white/70 dark:bg-black/35 backdrop-blur-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-300/80 to-cyan-300/70 dark:from-emerald-400/50 dark:to-cyan-400/45 flex items-center justify-center">
                  <Wind className="h-5 w-5 text-emerald-950 dark:text-emerald-100" />
                </div>
                <p className="text-sm uppercase tracking-[0.16em] text-foreground/70 font-manrope">Conseil rapide</p>
              </div>
              <p className="text-foreground/85 text-sm leading-relaxed font-manrope">
                Verifiez l'URL ou utilisez les actions ci-dessous pour reprendre votre navigation sans perdre le contexte.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <Button asChild size="lg" className="font-manrope">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Retour a l'accueil
              </Link>
            </Button>
            <Button onClick={() => window.history.back()} variant="outline" size="lg" className="border-black/20 bg-white/60 hover:bg-white/85 dark:border-white/25 dark:bg-white/10 dark:hover:bg-white/15 text-foreground font-manrope">
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
