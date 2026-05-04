import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog, Mail, Save } from 'lucide-react';

interface UserRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving?: boolean;
  onSave?: (payload: { id: string; full_name: string; email: string; role: 'admin' | 'user' }) => Promise<void> | void;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function UserRoleModal({ open, onOpenChange, user, onSave, isSaving = false }: UserRoleModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setRole(user?.role === 'admin' ? 'admin' : 'user');
  }, [user, open]);

  const handleSave = async () => {
    if (!user?.id || !onSave) {
      return;
    }
    await onSave({
      id: user.id,
      full_name: name,
      email,
      role,
    });
  };

  const handleSendInvite = () => {
    if (email && typeof window !== 'undefined') {
      window.open(`mailto:${email}`, '_blank');
    }
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
                <SelectItem value="user">
                  <div className="flex flex-col">
                    <span>Utilisateur</span>
                    <span className="text-xs text-muted-foreground">Accès standard aux fonctionnalités utilisateur</span>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={isSaving || !name || !email || !user?.id}>
            <Save className="w-4 h-4" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
