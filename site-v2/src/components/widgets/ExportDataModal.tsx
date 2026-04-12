import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDataModal({ open, onOpenChange }: ExportDataModalProps) {
  const [format, setFormat] = useState('csv');
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);

  const handleExport = () => {
    toast.success(`Export ${format.toUpperCase()} lancé`, {
      description: 'Votre fichier sera prêt dans quelques instants.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exporter les Données
          </DialogTitle>
          <DialogDescription>
            Choisissez le format et les données à exporter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Format d'export</Label>
            <RadioGroup value={format} onValueChange={setFormat} className="grid grid-cols-3 gap-3">
              <div>
                <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
                <Label
                  htmlFor="csv"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <FileSpreadsheet className="w-6 h-6 mb-2" />
                  CSV
                </Label>
              </div>
              <div>
                <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <FileText className="w-6 h-6 mb-2" />
                  PDF
                </Label>
              </div>
              <div>
                <RadioGroupItem value="json" id="json" className="peer sr-only" />
                <Label
                  htmlFor="json"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <FileJson className="w-6 h-6 mb-2" />
                  JSON
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Données à inclure</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="history" checked={includeHistory} onCheckedChange={(checked) => setIncludeHistory(!!checked)} />
                <Label htmlFor="history" className="font-normal cursor-pointer">Historique des mesures</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="alerts" checked={includeAlerts} onCheckedChange={(checked) => setIncludeAlerts(!!checked)} />
                <Label htmlFor="alerts" className="font-normal cursor-pointer">Alertes et notifications</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
