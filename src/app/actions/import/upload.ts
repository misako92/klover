"use server";

import { revalidatePath } from "next/cache";

import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { createClient } from "@/lib/supabase/server";

export async function uploadImportFile(formData: FormData) {
  await assertSameOrigin();
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);
  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file provided");
  }
  const maxBytes = 10 * 1024 * 1024;
  const originalName = file.name ?? "import.csv";
  const fileExt = originalName.split(".").pop()?.toLowerCase();
  const allowedMime = ["text/csv", "application/vnd.ms-excel"];
  if (fileExt !== "csv") {
    throw new Error("Unsupported file type");
  }
  if (file.size > maxBytes) {
    throw new Error("File too large");
  }
  if (file.type && !allowedMime.includes(file.type)) {
    throw new Error("Unsupported file type");
  }

  const safeName = originalName.replace(/[^\w.-]/g, "_").replace(/_+/g, "_");

  // 1. Upload to Supabase Storage
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase not configured");
  }
  const supabase = await createClient();
  const fileName = `${Date.now()}-${safeName}`;
  const filePath = `${orgId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("imports")
    .upload(filePath, file, { contentType: "text/csv", upsert: false });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("Failed to upload file");
  }

  // 2. Create Import Session Record
  const session = await prisma.importSession.create({
    data: {
      orgId,
      fileName: file.name,
      fileUrl: filePath,
      status: "MAPPING_REQUIRED",
    },
  });

  revalidatePath("/dashboard/orders");
  return { success: true, sessionId: session.id };
}
