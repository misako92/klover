"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import { z } from "zod";

import { requireOrgContext, requireOrgRole, requireUser } from "@/lib/auth/context";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { logAuditEvent } from "@/services/audit";
import { emailService } from "@/services/email";

import { randomBytes } from "node:crypto";

const invitationSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

const invitationIdSchema = z.string().min(1);
const invitationTokenSchema = z.string().min(20).max(255);

const INVITATION_DURATION_DAYS = 7;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getInvitationExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_DURATION_DAYS);
  return expiresAt;
}

async function getAppBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim() || process.env.VERCEL_URL?.trim();

  if (configured) {
    return configured.startsWith("http") ? configured.replace(/\/$/, "") : `https://${configured.replace(/\/$/, "")}`;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

async function expireOverdueInvitations(orgId?: string) {
  await prisma.organizationInvitation.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
      ...(orgId ? { orgId } : {}),
    },
    data: {
      status: "EXPIRED",
    },
  });
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return email;
  }

  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(localPart.length - visible.length, 1))}@${domain}`;
}

export async function getTeamWorkspace() {
  const { orgId, membership } = await requireOrgContext();
  await expireOverdueInvitations(orgId);

  const [organization, members, invitations] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true },
    }),
    prisma.organizationMember.findMany({
      where: { orgId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.organizationInvitation.findMany({
      where: {
        orgId,
        status: {
          in: ["PENDING", "EXPIRED"],
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    organization,
    currentRole: membership.role,
    members: members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      email: member.user.email,
      name: member.user.name ?? "",
      role: member.role,
      joinedAt: member.createdAt.toISOString(),
    })),
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
    })),
  };
}

export async function inviteTeamMember(input: z.infer<typeof invitationSchema>) {
  await assertSameOrigin();
  const parsed = invitationSchema.parse(input);
  const normalizedEmail = normalizeEmail(parsed.email);
  const { orgId, membership, user } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const existingMembership = await prisma.organizationMember.findFirst({
    where: {
      orgId,
      user: {
        email: normalizedEmail,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingMembership) {
    throw new Error("Cette personne appartient deja a l'organisation.");
  }

  const existingPendingInvitation = await prisma.organizationInvitation.findFirst({
    where: {
      orgId,
      email: normalizedEmail,
      status: "PENDING",
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  const token = randomBytes(24).toString("hex");
  const expiresAt = getInvitationExpiryDate();

  const invitation = existingPendingInvitation
    ? await prisma.organizationInvitation.update({
        where: { id: existingPendingInvitation.id },
        data: {
          role: parsed.role,
          token,
          expiresAt,
          invitedByUserId: user.id,
          status: "PENDING",
        },
      })
    : await prisma.organizationInvitation.create({
        data: {
          orgId,
          email: normalizedEmail,
          role: parsed.role,
          token,
          expiresAt,
          invitedByUserId: user.id,
          status: "PENDING",
        },
      });

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  const invitationUrl = `${await getAppBaseUrl()}/invite/${invitation.token}`;

  try {
    await emailService.sendEmail({
      to: normalizedEmail,
      subject: `Invitation a rejoindre ${organization?.name ?? "Klover"}`,
      html: `
        <h1>Invitation Klover</h1>
        <p>Vous avez ete invite(e) a rejoindre l'organisation <strong>${organization?.name ?? "Klover"}</strong>.</p>
        <p>Role propose : <strong>${parsed.role}</strong></p>
        <p>Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR")}.</p>
        <p><a href="${invitationUrl}">Accepter l'invitation</a></p>
      `,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Invitation creee, mais l'email n'a pas pu etre envoye: ${error.message}`
        : "Invitation creee, mais l'email n'a pas pu etre envoye.",
    );
  }

  await logAuditEvent({
    orgId,
    userId: user.id,
    action: "TEAM_INVITATION_SENT",
    entityType: "OrganizationInvitation",
    entityId: invitation.id,
    details: {
      email: normalizedEmail,
      role: parsed.role,
    },
  });

  revalidatePath("/dashboard/settings");

  return {
    success: true,
    invitationId: invitation.id,
  };
}

export async function revokeTeamInvitation(invitationId: string) {
  await assertSameOrigin();
  const parsedId = invitationIdSchema.parse(invitationId);
  const { orgId, membership, user } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const result = await prisma.organizationInvitation.updateMany({
    where: {
      id: parsedId,
      orgId,
      status: {
        in: ["PENDING", "EXPIRED"],
      },
    },
    data: {
      status: "REVOKED",
    },
  });

  if (result.count === 0) {
    throw new Error("Invitation introuvable ou deja traitee.");
  }

  await logAuditEvent({
    orgId,
    userId: user.id,
    action: "TEAM_INVITATION_REVOKED",
    entityType: "OrganizationInvitation",
    entityId: parsedId,
  });

  revalidatePath("/dashboard/settings");

  return { success: true };
}

export async function getInvitationDetails(rawToken: string) {
  const token = invitationTokenSchema.parse(rawToken);
  await expireOverdueInvitations();

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  return {
    id: invitation.id,
    email: invitation.email,
    maskedEmail: maskEmail(invitation.email),
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    organization: invitation.organization,
  };
}

export async function acceptTeamInvitation(rawToken: string) {
  await assertSameOrigin();
  const token = invitationTokenSchema.parse(rawToken);
  const user = await requireUser();

  await expireOverdueInvitations();

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      orgId: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invitation || invitation.status !== "PENDING") {
    throw new Error("Invitation invalide ou deja utilisee.");
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    throw new Error("Cette invitation a expire.");
  }

  if (normalizeEmail(user.email ?? "") !== normalizeEmail(invitation.email)) {
    throw new Error("Connectez-vous avec l'adresse email invitee pour accepter cette invitation.");
  }

  await prisma.$transaction(async (tx) => {
    const existingMembership = await tx.organizationMember.findFirst({
      where: {
        userId: user.id,
        orgId: invitation.orgId,
      },
      select: {
        id: true,
      },
    });

    if (!existingMembership) {
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          orgId: invitation.orgId,
          role: invitation.role,
        },
      });
    }

    await tx.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });
  });

  (await cookies()).set("org_id", invitation.orgId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  await logAuditEvent({
    orgId: invitation.orgId,
    userId: user.id,
    action: "TEAM_INVITATION_ACCEPTED",
    entityType: "OrganizationInvitation",
    entityId: invitation.id,
    details: {
      email: invitation.email,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/default");

  return {
    success: true,
    organizationName: invitation.organization.name,
  };
}
