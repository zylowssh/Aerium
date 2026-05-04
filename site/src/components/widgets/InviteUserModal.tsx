import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInviting?: boolean;
  onInvite?: (payload: { email: string; full_name: string; password: string; role: 'admin' | 'user' }) => Promise<void> | void;
}

export function InviteUserModal({ open, onOpenChange, onInvite, isInviting = false }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [message, setMessage] = useState('');

  const handleInvite = async () => {
    if (!email || !password) {
      toast.error('Email et mot de passe sont requis');
      return;
    }

    if (onInvite) {
      await onInvite({
        email,
        full_name: fullName,
        password,
        role,
      });
    }

    setEmail('');
    setFullName('');
    setPassword('');
    setRole('user');
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Inviter un Utilisateur
          </DialogTitle>
          <DialogDescription>
            Envoyez une invitation pour rejoindre votre espace de travail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Adresse email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="collegue@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-name">Nom complet</Label>
            <Input
              id="invite-name"
              placeholder="Alex Martin"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-password">Mot de passe initial</Label>
            <Input
              id="invite-password"
              type="password"
              placeholder="Minimum 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Rôle</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-message">Message personnalisé (optionnel)</Label>
            <Input
              id="invite-message"
              placeholder="Bienvenue dans notre équipe !"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isInviting}>
            Annuler
          </Button>
          <Button onClick={handleInvite} className="gap-2" disabled={isInviting || !email || !password}>
            <Send className="w-4 h-4" />
            {isInviting ? 'Création...' : "Envoyer l'Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
