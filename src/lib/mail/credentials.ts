/**
 * @deprecated Import from '@/app/(authenticated)/mail/repository' instead.
 * This file re-exports for backward compatibility.
 */
export type { EmailCredentials, SaveEmailCredentialsInput } from '@/app/(authenticated)/mail/domain';
export {
  CLOUDRON_DEFAULTS,
  getEmailCredentialsById,
  getEmailCredentials,
  getAllEmailCredentials,
  credentialsToMailConfig,
  getUserMailConfig,
  saveEmailCredentials,
  deleteEmailCredentials,
} from '@/app/(authenticated)/mail/repository';
