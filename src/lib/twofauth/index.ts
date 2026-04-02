/**
 * Feature: 2FAuth
 *
 * Gerenciamento de autenticação de dois fatores
 */

// Componentes
export { TwoFAuthConfigContent } from "./components/twofauth-config-content";

// Hooks
export {
  useTwoFAuthAccounts,
  useTwoFAuthGroups,
  type TwoFAuthAccount,
  type TwoFAuthGroup,
  type OTPResult,
} from "./hooks";
