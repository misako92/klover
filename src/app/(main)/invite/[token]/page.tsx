import Link from "next/link";

import { getInvitationDetails } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/context";

import { AcceptInvitationCard } from "./accept-invitation-card";

interface InvitationPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const [invitation, currentUser] = await Promise.all([getInvitationDetails(token), getCurrentUser()]);

  if (!invitation) {
    return (
      <div className="container mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-12">
        <Card className="glass-card w-full max-w-xl">
          <CardHeader>
            <CardTitle>Invitation introuvable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground text-sm">
            <p>Ce lien n'existe pas ou a deja ete retire.</p>
            <Button asChild>
              <Link href="/auth/v2/login">Retour a la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "ACCEPTED") {
    return (
      <div className="container mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-12">
        <Card className="glass-card w-full max-w-xl">
          <CardHeader>
            <CardTitle>Invitation deja acceptee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground text-sm">
            <p>Cette invitation a deja ete utilisee pour rejoindre {invitation.organization.name}.</p>
            <Button asChild>
              <Link href="/dashboard/default">Ouvrir le tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "REVOKED" || invitation.status === "EXPIRED") {
    return (
      <div className="container mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-12">
        <Card className="glass-card w-full max-w-xl">
          <CardHeader>
            <CardTitle>Invitation non disponible</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground text-sm">
            <p>
              Cette invitation a ete revoquee ou a expire. Contactez votre administrateur pour en recevoir une nouvelle.
            </p>
            <Button asChild>
              <Link href="/auth/v2/login">Retour a la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canAccept = currentUser?.email?.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-12">
      <AcceptInvitationCard
        token={token}
        organizationName={invitation.organization.name}
        email={invitation.email}
        maskedEmail={invitation.maskedEmail}
        role={invitation.role}
        canAccept={canAccept}
      />
    </div>
  );
}
