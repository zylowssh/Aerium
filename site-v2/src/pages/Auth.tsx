import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Leaf, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
});

const signupSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  fullName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" })
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/dashboard');
    }
    
    // Load remembered email
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      setLoginEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.login(loginEmail, loginPassword);
      
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('remembered_email', loginEmail);
      } else {
        localStorage.removeItem('remembered_email');
      }
      
      toast.success('Connexion réussie !');
      window.location.href = '/dashboard';
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Une erreur est survenue';
      if (errorMsg.includes('Invalid login credentials')) {
        toast.error('Email ou mot de passe incorrect');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validation = signupSchema.safeParse({ 
      email: signupEmail, 
      password: signupPassword,
      fullName: signupFullName 
    });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.register(signupEmail, signupPassword, signupFullName);
      toast.success('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
      // Auto-login after registration
      await apiClient.login(signupEmail, signupPassword);
      window.location.href = '/dashboard';
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Une erreur est survenue';
      if (errorMsg.includes('already registered')) {
        toast.error('Cet email est déjà utilisé');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {
      /* Demo Credentials Banner
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-sm">
          <p className="text-center font-medium text-foreground mb-1">🎯 Demo Accounts Available</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <div>
              <strong>User:</strong> demo@aerium.app / demo123
            </div>
            <div>
              <strong>Admin:</strong> admin@aerium.app / admin123
            </div>
          </div>
        </div>
      </div>
      */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <img src="/logo.png" alt="Aerium" className="w-full h-full object-fill" />
            </div>
            <span className="text-2xl font-bold text-foreground">Aerium</span>
          </div>
          <p className="text-muted-foreground">
            Connectez-vous pour accéder à votre tableau de bord
          </p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Bienvenue</CardTitle>
            <CardDescription>
              Gérez la qualité de l'air de vos espaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="votre@email.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label 
                      htmlFor="remember-me"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      Se souvenir de moi
                    </Label>
                  </div>

                  <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>

                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">Comptes de démonstration :</p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p><strong>Admin :</strong> admin@aerium.app / admin123</p>
                    <p><strong>Utilisateur :</strong> demo@aerium.app / demo123</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jean Dupont"
                        className="pl-10"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                      />
                    </div>
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="votre@email.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                    {isLoading ? 'Création...' : 'Créer un compte'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
