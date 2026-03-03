import { generateMeta } from "@/lib/utils";

import { Mail } from "./components/mail";
import { cookies } from "next/headers";

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
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const collapsed = (await cookies()).get(collapsedCookieID);
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-md border">
      <Mail defaultLayout={defaultLayout} cookieID={cookieID} defaultCollapsed={defaultCollapsed} collapsedCookieID={collapsedCookieID} />
    </div>
  );
}
