import { Check, CheckCheck, AlertCircle, Loader2 } from "lucide-react";
import { MessageStatus } from "../domain";

export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case "sending":
      return <Loader2 className="size-3 shrink-0 text-muted-foreground animate-spin" />;
    case "failed":
      return <AlertCircle className="size-3 shrink-0 text-destructive" />;
    case "read":
      return <CheckCheck className="size-3 shrink-0 text-success/60" />;
    case "forwarded":
      return <CheckCheck className="size-3 shrink-0 text-muted-foreground" />;
    case "sent":
      return <Check className="size-3 shrink-0 text-primary/50" />;
    default:
      return null;
  }
}
