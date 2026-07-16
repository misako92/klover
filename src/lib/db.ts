import "server-only";

import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const REQUIRED_DELEGATES = ["integration", "ecoOrganismConfig", "organizationInvitation"] as const;

function hasRequiredDelegates(client: PrismaClient) {
  return REQUIRED_DELEGATES.every((delegateName) => delegateName in client);
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const existingClient = globalThis.prismaGlobal;
const prisma = existingClient && hasRequiredDelegates(existingClient) ? existingClient : prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
