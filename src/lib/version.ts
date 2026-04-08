/**
 * Utilitários de verificação de versão do build
 *
 * Usados para detectar quando o cliente está rodando uma versão antiga
 * do JavaScript após um deploy, evitando erros de "Failed to find Server Action".
 */

/** ID do build atual (git commit hash ou 'development') */
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || "development";

/** Chave usada no sessionStorage para armazenar o BUILD_ID */
const BUILD_ID_STORAGE_KEY = "__SYNTHROPIC_BUILD_ID__";

/**
 * Verifica se houve mudança de versão desde o carregamento inicial da página.
 *
 * Na primeira chamada, armazena o BUILD_ID atual no sessionStorage.
 * Nas chamadas subsequentes, compara com o valor armazenado.
 *
 * @returns true se a versão mudou (indicando que um novo deploy ocorreu)
 */
export function checkVersionMismatch(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const storedBuildId = sessionStorage.getItem(BUILD_ID_STORAGE_KEY);

    // Primeira visita - armazenar BUILD_ID atual
    if (!storedBuildId) {
      sessionStorage.setItem(BUILD_ID_STORAGE_KEY, BUILD_ID);
      return false;
    }

    // Comparar com BUILD_ID armazenado
    return storedBuildId !== BUILD_ID;
  } catch {
    // sessionStorage pode não estar disponível (modo privado, etc)
    return false;
  }
}

/**
 * Atualiza o BUILD_ID armazenado para o valor atual.
 * Útil após detectar uma mudança de versão e antes de forçar reload.
 */
export function updateStoredVersion(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(BUILD_ID_STORAGE_KEY, BUILD_ID);
  } catch {
    // Ignorar erros de storage
  }
}

/**
 * Limpa o BUILD_ID armazenado.
 * Útil para forçar uma nova verificação na próxima visita.
 */
export function clearStoredVersion(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(BUILD_ID_STORAGE_KEY);
  } catch {
    // Ignorar erros de storage
  }
}

/**
 * Limpa todos os caches do Service Worker e força atualização.
 * @returns Promise que resolve quando o cache foi limpo
 */
export async function clearServiceWorkerCache(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));

    // Notificar SW para pular espera e ativar imediatamente
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
    }

    // Forçar atualização de todas as registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.update()));
  } catch (error) {
    console.error("[Version] Erro ao limpar cache do SW:", error);
  }
}

/**
 * Verifica se o erro é relacionado a Server Action não encontrada.
 */
export function isServerActionVersionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message || "";
  return (
    message.includes("Failed to find Server Action") ||
    message.includes("This request might be from an older or newer deployment")
  );
}

/**
 * Handler para erros de versão de Server Action.
 * Limpa caches e força reload da página.
 */
export async function handleVersionMismatchError(): Promise<void> {
  console.log("[Version] Detectada incompatibilidade de versão - recarregando...");

  // Atualizar versão armazenada para evitar loop
  updateStoredVersion();

  // Limpar cache do SW
  await clearServiceWorkerCache();

  // Forçar reload sem cache
  window.location.reload();
}
