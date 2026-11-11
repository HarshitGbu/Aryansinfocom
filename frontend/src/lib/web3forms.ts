// Web3Forms access key (public by design — safe to ship in client code).
const ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || "41d88e24-f1f1-49ea-805a-92cd821a10a7";
const ENDPOINT = "https://api.web3forms.com/submit";

export type Web3FormsField = string | number | boolean | null | undefined;

export async function submitToWeb3Forms(
  subject: string,
  fields: Record<string, Web3FormsField>,
): Promise<void> {
  const { website, botcheck, ...rest } = fields;

  // Honeypot / bot guard: silently drop bot submissions without hitting Web3Forms
  // or leaking the decoy field upstream.
  if (
    (website !== undefined && website !== null && String(website).trim() !== "") ||
    botcheck === true
  ) {
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      access_key: ACCESS_KEY,
      subject,
      ...rest,
      botcheck: false,
    }),
  });

  const data = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Web3Forms submission failed");
  }
}
