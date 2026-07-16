import { Lock, UserCog } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireOrgContext } from "@/lib/auth/context";

import { AccountActions } from "./_components/account-actions";

export default async function AccountPage() {
  const { user, membership } = await requireOrgContext();

  const email = user.email ?? "";
  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const firstName = meta.first_name ?? meta.name?.split(" ")[0] ?? "";
  const lastName = meta.last_name ?? meta.name?.split(" ").slice(1).join(" ") ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || email.charAt(0).toUpperCase();

  const roleLabels: Record<string, string> = {
    OWNER: "Propriétaire",
    ADMIN: "Administrateur",
    MEMBER: "Membre",
    VIEWER: "Lecteur",
  };

  return (
    <div className="stagger-1 container mx-auto max-w-4xl animate-enter space-y-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">Mon Compte</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Card */}
        <Card className="glass-card stagger-2 animate-enter">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="size-5 text-emerald-600" /> Informations Profil
            </CardTitle>
            <CardDescription>Ces informations sont visibles par votre équipe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              <Avatar className="size-24 border-2 border-border">
                <AvatarFallback className="bg-emerald-50 font-medium text-emerald-700 text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="grid w-full flex-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" defaultValue={firstName} disabled className="bg-muted text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" defaultValue={lastName} disabled className="bg-muted text-muted-foreground" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email Professionnel</Label>
                  <Input id="email" defaultValue={email} disabled className="bg-muted text-muted-foreground" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="role">Rôle</Label>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      {roleLabels[membership.role] ?? membership.role}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {membership.role === "OWNER" || membership.role === "ADMIN"
                        ? "Accès complet au dashboard"
                        : "Accès limité"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="glass-card stagger-3 animate-enter">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5 text-emerald-600" /> Sécurité
            </CardTitle>
            <CardDescription>Gérez votre mot de passe.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Mot de passe</Label>
                <p className="text-muted-foreground text-sm">
                  Envoyez-vous un email pour réinitialiser votre mot de passe.
                </p>
              </div>
              <AccountActions email={email} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
