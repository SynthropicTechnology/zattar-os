import type { MailAddress, MailMessagePreview } from "@/lib/mail/types";

type AddressFormat = "summary" | "full";

function isPresent(value: string | undefined | null): value is string {
  return Boolean(value && value.trim());
}

function formatMailAddress(
  address: MailAddress | undefined,
  format: AddressFormat = "summary"
): string {
  if (!address) return "";

  const name = address.name?.trim() ?? "";
  const email = address.address?.trim() ?? "";

  if (format === "full") {
    if (name && email && name !== email) {
      return `${name} <${email}>`;
    }

    return email || name;
  }

  return name || email;
}

export function isSentMail(mail: Pick<MailMessagePreview, "folder">): boolean {
  return mail.folder === "Sent";
}

export function getMailPrimaryAddress(mail: MailMessagePreview): MailAddress {
  if (isSentMail(mail) && mail.to.length > 0) {
    return mail.to[0];
  }

  return mail.from;
}

export function getMailPrimaryName(mail: MailMessagePreview): string {
  return formatMailAddress(getMailPrimaryAddress(mail)) || "Contato desconhecido";
}

export function getMailParticipantLabel(mail: MailMessagePreview): "De" | "Para" {
  return isSentMail(mail) ? "Para" : "De";
}

export function getMailParticipantLine(mail: MailMessagePreview): string {
  if (isSentMail(mail)) {
    return formatMailAddressList(mail.to, "full");
  }

  return formatMailAddress(mail.from, "full");
}

export function formatMailAddressList(
  addresses: MailAddress[],
  format: AddressFormat = "summary"
): string {
  const uniqueValues = Array.from(
    new Set(addresses.map((address) => formatMailAddress(address, format)).filter(isPresent))
  );

  return uniqueValues.join(", ");
}

export function getMailListPreview(mail: MailMessagePreview): string {
  const preview = mail.preview?.trim() ?? "";
  const subject = mail.subject?.trim() ?? "";

  if (preview && preview !== subject) {
    return preview;
  }

  if (isSentMail(mail)) {
    const recipients = formatMailAddressList(mail.to, "summary");
    return recipients ? `Para: ${recipients}` : "";
  }

  return "";
}