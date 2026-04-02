import { Check, CheckCheck, AlertCircle, Loader2 } from "lucide-react";
import { MessageStatus } from "../domain";

export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case "sending":
      return <Loader2 className="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />;
    case "read":
      return <CheckCheck className="h-4 w-4 shrink-0 text-green-500" />;
    case "forwarded":
      return <CheckCheck className="text-muted-foreground h-4 w-4 shrink-0" />;
    case "sent":
      return <Check className="text-muted-foreground h-4 w-4 shrink-0" />;
    default:
      return null;
  }
}