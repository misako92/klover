import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const email = "demo@klover.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Klover Admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Klover",
    },
  });

  console.log(`User created: ${user.email}`);

  const orgSlug = "klover-demo";
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: {
      name: "Klover Demo",
      slug: orgSlug,
    },
  });

  console.log(`Organization created: ${org.name}`);

  await prisma.organizationMember.upsert({
    where: {
      userId_orgId: {
        userId: user.id,
        orgId: org.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      orgId: org.id,
      role: UserRole.OWNER,
    },
  });

  console.log("Membership created");
  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
