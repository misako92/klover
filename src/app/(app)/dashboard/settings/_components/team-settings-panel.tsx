"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { CheckCircle2, Loader2, MailPlus, Shield, UserPlus, XCircle } from "lucide-react";
import { toast } from "sonner";

import { getTeamWorkspace, inviteTeamMember, revokeTeamInvitation } from "@/app/actions/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TeamRole = "OWNER" | "ADMIN" | "MEMBER";
type InvitationRole = "ADMIN" | "MEMBER";
type InvitationStatus = "PENDING" | "EXPIRED";

interface WorkspaceMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: TeamRole;
  joinedAt: string;
}

interface WorkspaceInvitation {
  id: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

interface TeamWorkspaceResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  currentRole: TeamRole;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    dateStyle: "medium",
  });
}

function roleBadge(role: TeamRole | InvitationRole) {
  if (role === "OWNER") {
    return <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Owner</Badge>;
  }

  if (role === "ADMIN") {
    return (
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
        Admin
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Member
    </Badge>
  );
}

function invitationBadge(status: InvitationStatus) {
  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
        En attente
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-muted bg-muted text-muted-foreground">
      Expiree
    </Badge>
  );
}

export function TeamSettingsPanel() {
  const [workspace, setWorkspace] = useState<TeamWorkspaceResponse | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("MEMBER");
  const [inviting, startInviting] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    const response = (await getTeamWorkspace()) as TeamWorkspaceResponse;
    setWorkspace(response);
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const canManage = useMemo(
    () => workspace?.currentRole === "OWNER" || workspace?.currentRole === "ADMIN",
    [workspace?.currentRole],
  );

  const handleInvite = () => {
    startInviting(async () => {
      try {
        await inviteTeamMember({ email, role });
        toast.success("Invitation envoyee.");
        setEmail("");
        setRole("MEMBER");
        await loadWorkspace();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi.");
      }
    });
  };

  const handleRevoke = async (invitationId: string) => {
    setRevokingId(invitationId);
    try {
      await revokeTeamInvitation(invitationId);
      toast.success("Invitation revoquee.");
      await loadWorkspace();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la revocation.");
    } finally {
      setRevokingId(null);
    }
  };

  if (!workspace) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Chargement de l'equipe...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-emerald-600" />
            Inviter un membre
          </CardTitle>
          <CardDescription>
            Envoyez une invitation email pour rejoindre {workspace.organization?.name ?? "l'organisation"} avec un role
            borne.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="w-full flex-1 space-y-2">
            <Label htmlFor="invite-email" className="sr-only">
              Email professionnel
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="prenom@entreprise.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!canManage}
              className="bg-white/50"
            />
          </div>
          <div className="w-full space-y-2 md:w-48">
            <Label htmlFor="invite-role" className="sr-only">
              Role
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as InvitationRole)} disabled={!canManage}>
              <SelectTrigger id="invite-role" className="bg-white/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="mt-auto flex flex-col items-start justify-between gap-4 border-border/40 border-t bg-muted/10 pt-4 sm:flex-row sm:items-center">
          <p className="text-muted-foreground text-xs">
            L'invitation expire sous 7 jours. Le lien exige une connexion avec l'email invite.
          </p>
          <Button
            onClick={handleInvite}
            disabled={!canManage || !email.trim() || inviting}
            className="w-full bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 sm:w-auto"
          >
            {inviting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MailPlus className="mr-2 size-4" />}
            Envoyer l'invitation
          </Button>
        </CardFooter>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-emerald-600" />
            Membres de l'organisation
          </CardTitle>
          <CardDescription>
            Les roles actifs sont appliques cote serveur sur toutes les actions sensibles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-xs">
            Faites defiler horizontalement sur mobile pour lire tous les roles et dates.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Depuis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspace.members.map((member) => (
                <TableRow
                  key={member.id}
                  className="group relative cursor-default transition-all duration-300 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-emerald-500 before:opacity-0 hover:bg-emerald-50/40 hover:shadow-[inset_0_1px_0_0_rgba(16,185,129,0.1),inset_0_-1px_0_0_rgba(16,185,129,0.1)] hover:before:opacity-100"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium transition-colors group-hover:text-emerald-800">
                        {member.name || member.email}
                      </span>
                      <span className="text-muted-foreground text-xs">{member.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{roleBadge(member.role)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDateLabel(member.joinedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Invitations en cours</CardTitle>
          <CardDescription>
            Suivez les invitations pendantes et revoquez celles qui ne doivent plus etre valides.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workspace.invitations.length === 0 ? (
            <div className="rounded-xl border border-border border-dashed bg-muted/10 p-6 text-center text-muted-foreground text-sm">
              Aucune invitation en attente pour le moment.
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                Les invitations sont lisibles en cartes sur mobile et en tableau sur les ecrans larges.
              </p>
              <div className="grid gap-3 lg:hidden">
                {workspace.invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="group hover:-translate-y-0.5 cursor-default rounded-2xl border border-border/40 bg-white/60 p-4 shadow-soft backdrop-blur-md transition-all duration-300 hover:border-emerald-200 hover:shadow-soft-lg"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-foreground transition-colors group-hover:text-emerald-800">
                          {invitation.email}
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">
                          Expire le {formatDateLabel(invitation.expiresAt)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {roleBadge(invitation.role)}
                        {invitationBadge(invitation.status)}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-0 text-muted-foreground hover:text-red-600"
                        onClick={() => handleRevoke(invitation.id)}
                        disabled={!canManage || revokingId === invitation.id}
                      >
                        {revokingId === invitation.id ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 size-4" />
                        )}
                        Revoquer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workspace.invitations.map((invitation) => (
                      <TableRow
                        key={invitation.id}
                        className="group relative cursor-default transition-all duration-300 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-emerald-500 before:opacity-0 hover:bg-emerald-50/40 hover:shadow-[inset_0_1px_0_0_rgba(16,185,129,0.1),inset_0_-1px_0_0_rgba(16,185,129,0.1)] hover:before:opacity-100"
                      >
                        <TableCell className="font-medium transition-colors group-hover:text-emerald-800">
                          {invitation.email}
                        </TableCell>
                        <TableCell>{roleBadge(invitation.role)}</TableCell>
                        <TableCell>{invitationBadge(invitation.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateLabel(invitation.expiresAt)}
                        </TableCell>
                        <TableCell className="text-right opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:bg-red-50 hover:text-red-700 focus:opacity-100"
                            onClick={() => handleRevoke(invitation.id)}
                            disabled={!canManage || revokingId === invitation.id}
                          >
                            {revokingId === invitation.id ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 size-4" />
                            )}
                            Revoquer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
        {!canManage ? (
          <CardFooter>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Votre role actuel permet la consultation, pas l'envoi ou la revocation.
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}
