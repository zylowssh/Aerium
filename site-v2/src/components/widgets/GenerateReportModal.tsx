import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, BarChart3, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateReportModal({ open, onOpenChange }: GenerateReportModalProps) {
  const [reportType, setReportType] = useState('daily');
  const [format, setFormat] = useState('pdf');
  const [period, setPeriod] = useState('week');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);

  const handleGenerate = () => {
    toast.success('Rapport en cours de génération', {
      description: 'Votre rapport sera disponible dans quelques instants.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Générer un Rapport
          </DialogTitle>
          <DialogDescription>
            Configurez les paramètres de votre rapport personnalisé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Type de rapport</Label>
            <RadioGroup value={reportType} onValueChange={setReportType} className="grid grid-cols-3 gap-3">
              <div>
                <RadioGroupItem value="daily" id="daily" className="peer sr-only" />
                <Label
                  htmlFor="daily"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <Calendar className="w-5 h-5 mb-1" />
                  <span className="text-sm">Quotidien</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="weekly" id="weekly" className="peer sr-only" />
                <Label
                  htmlFor="weekly"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <BarChart3 className="w-5 h-5 mb-1" />
                  <span className="text-sm">Hebdomadaire</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="monthly" id="monthly" className="peer sr-only" />
                <Label
                  htmlFor="monthly"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5 mb-1" />
                  <span className="text-sm">Mensuel</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Ce trimestre</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Contenu du rapport</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="charts" checked={includeCharts} onCheckedChange={(checked) => setIncludeCharts(!!checked)} />
                <Label htmlFor="charts" className="font-normal cursor-pointer">Inclure les graphiques et tendances</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="report-alerts" checked={includeAlerts} onCheckedChange={(checked) => setIncludeAlerts(!!checked)} />
                <Label htmlFor="report-alerts" className="font-normal cursor-pointer">Inclure l'historique des alertes</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} className="gap-2">
            <Download className="w-4 h-4" />
            Générer le Rapport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
