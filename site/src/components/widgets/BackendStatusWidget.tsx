import { motion } from 'framer-motion';
import { Server, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBackendContext } from '@/contexts/BackendContext';
import { cn } from '@/lib/utils';

export function BackendStatusWidget() {
  const { status, checkFlask, isFlaskEnabled, config } = useBackendContext();

  const handleRefresh = async () => {
    await checkFlask();
  };
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="p-5 rounded-xl bg-card border border-border"
     >
       <div className="flex items-center justify-between mb-4">
         <div>
           <h3 className="font-semibold text-foreground">Statut des Backends</h3>
           <p className="text-sm text-muted-foreground">Connexion aux serveurs</p>
         </div>
         <Button variant="ghost" size="icon" onClick={handleRefresh}>
           <RefreshCw className="w-4 h-4" />
         </Button>
       </div>
 
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              isFlaskEnabled ? 'bg-warning/10' : 'bg-muted'
            )}>
              <Server className={cn(
                'w-5 h-5',
                isFlaskEnabled ? 'text-warning' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <p className="font-medium text-foreground">Flask Backend</p>
              <p className="text-xs text-muted-foreground">
                {isFlaskEnabled ? 'API, simulation, alertes email' : 'Non configuré'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isFlaskEnabled ? (
              <span className="text-sm text-muted-foreground">Désactivé</span>
            ) : status.flask.checking ? (
              <>
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                <span className="text-sm text-muted-foreground">Vérification...</span>
              </>
            ) : status.flask.healthy ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-sm font-medium text-success">Connecté</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">Déconnecté</span>
              </>
            )}
          </div>
        </div>
      </div>
 
       {/* Feature Routing Info */}
       <div className="mt-4 pt-4 border-t border-border">
         <p className="text-xs text-muted-foreground mb-2">Routage des fonctionnalités :</p>
         <div className="grid grid-cols-2 gap-2 text-xs">
           {Object.entries(config.features).map(([feature, backend]) => (
             <div key={feature} className="flex items-center justify-between">
               <span className="text-muted-foreground capitalize">{feature}</span>
              <span className="px-1.5 py-0.5 rounded bg-warning/10 text-warning">
                Flask
               </span>
             </div>
           ))}
         </div>
       </div>
     </motion.div>
   );
 }