import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { WebsiteScaleProvider } from "./website-scale-provider";

interface WebsiteShellProps {
  children: ReactNode;
}

export function WebsiteShell({ children }: WebsiteShellProps) {
  return (
    <div className="dark min-h-screen bg-surface text-on-surface font-body selection:bg-primary/30 selection:text-primary">
      <WebsiteScaleProvider />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
