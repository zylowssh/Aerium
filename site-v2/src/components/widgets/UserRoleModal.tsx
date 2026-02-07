import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog, Mail, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function UserRoleModal({ open, onOpenChange, user }: UserRoleModalProps) {
  const [name, setName] = useState(user?.name || 'Alex Martin');
  const [email, setEmail] = useState(user?.email || 'alex@aerium.io');
  const [role, setRole] = useState(user?.role || 'viewer');

  const handleSave = () => {
    toast.success('Utilisateur mis à jour', {
      description: `Les permissions de ${name} ont été modifiées.`,
    });
    onOpenChange(false);
  };

  const handleSendInvite = () => {
    toast.success('Invitation envoyée', {
      description: `Un email a été envoyé à ${email}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Gérer l'Utilisateur
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations et le rôle de cet utilisateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nom complet</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Adresse email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-role">Rôle</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span>Administrateur</span>
                    <span className="text-xs text-muted-foreground">Accès complet à toutes les fonctionnalités</span>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex flex-col">
                    <span>Gestionnaire</span>
                    <span className="text-xs text-muted-foreground">Peut gérer les capteurs et les alertes</span>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex flex-col">
                    <span>Lecteur</span>
                    <span className="text-xs text-muted-foreground">Accès en lecture seule</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={handleSendInvite} className="w-full gap-2">
            <Mail className="w-4 h-4" />
            Renvoyer l'invitation
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
