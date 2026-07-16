"use client";

import { useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { acceptTeamInvitation } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AcceptInvitationCardProps {
  token: string;
  organizationName: string;
  email: string;
  maskedEmail: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  canAccept: boolean;
}

export function AcceptInvitationCard({
  token,
  organizationName,
  email,
  maskedEmail,
  role,
  canAccept,
}: AcceptInvitationCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      try {
        await acceptTeamInvitation(token);
        toast.success("Invitation acceptee.");
        router.push("/dashboard/default");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible d'accepter l'invitation.");
      }
    });
  };

  return (
    <Card className="glass-card w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-600" />
          Invitation d'equipe
        </CardTitle>
        <CardDescription>
          Vous avez ete invite(e) a rejoindre <strong>{organizationName}</strong> avec le role <strong>{role}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-muted-foreground text-sm">
        <p>
          L'invitation est liee a l'adresse <strong>{maskedEmail}</strong>.
        </p>
        <p>
          {canAccept
            ? "Vous etes connecte(e) avec le bon compte. Vous pouvez accepter cette invitation maintenant."
            : "Connectez-vous ou creez un compte avec cette adresse email pour rejoindre l'organisation."}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        {canAccept ? (
          <Button
            onClick={handleAccept}
            disabled={isPending}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Accepter l'invitation
          </Button>
        ) : (
          <>
            <Button asChild>
              <Link
                href={`/auth/v2/login?next=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(email)}`}
              >
                Se connecter
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href={`/auth/v2/register?next=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(email)}`}
              >
                Creer un compte
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
