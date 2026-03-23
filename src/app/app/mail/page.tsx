import { generateMeta } from "@/lib/utils";

import { Mail } from "./components/mail";
import { cookies } from "next/headers";

const FALLBACK_LAYOUT = [16, 36, 48];

function normalizeMailLayout(value: string | undefined): number[] | undefined {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed) || parsed.length !== 3) {
      return FALLBACK_LAYOUT;
    }

    const layout = parsed.map((entry) => Number(entry));
    const isValid = layout.every((entry) => Number.isFinite(entry) && entry > 0);

    if (!isValid) {
      return FALLBACK_LAYOUT;
    }

    const [left, middle, right] = layout;

    if (left < 15 || middle < 34 || right < 38) {
      return FALLBACK_LAYOUT;
    }

    return layout;
  } catch {
    return FALLBACK_LAYOUT;
  }
}

export async function generateMetadata() {
  return generateMeta({
    title: "E-mail",
    description: "Gerenciamento de e-mails integrado com Cloudron.",
    canonical: "/app/mail"
  });
}

export default async function MailPage() {
  const cookieID = "react-resizable-panels:layout:mail-app"
  const collapsedCookieID = "react-resizable-panels:collapsed"

  const layout = (await cookies()).get(cookieID);
  const defaultLayout = normalizeMailLayout(layout?.value);
  const collapsed = (await cookies()).get(collapsedCookieID);
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-md border">
      <Mail defaultLayout={defaultLayout} cookieID={cookieID} defaultCollapsed={defaultCollapsed} collapsedCookieID={collapsedCookieID} />
    </div>
  );
}
