export function isServerMockMode() {
  const raw = process.env.MOCK_MODE ?? process.env.NEXT_PUBLIC_MOCK_MODE;
  if (raw != null) {
    return raw === "true";
  }

  return process.env.NODE_ENV !== "production";
}
