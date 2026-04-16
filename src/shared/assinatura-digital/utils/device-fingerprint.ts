/**
 * Device Fingerprint Utility
 *
 * Coleta dados do dispositivo para identificação única em conformidade com MP 2.200-2/2001.
 * Utilizado para auditoria de assinaturas eletrônicas, gerando evidência técnica adicional
 * sobre o contexto do dispositivo no momento da assinatura.
 *
 * @module device-fingerprint
 * @legal MP 2.200-2/2001 - ICP-Brasil - Assinatura Eletrônica Avançada
 */

import type { DeviceFingerprintData } from '../types';

/**
 * Gera hash SHA-256 de uma string.
 * Retorna string vazia em ambientes sem Web Crypto API (SSR/tests).
 */
async function generateHash(data: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return '';
  }

  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Erro ao gerar hash:', error);
    return '';
  }
}

/**
 * Gera fingerprint do canvas para identificação única do dispositivo.
 * Retorna string vazia em ambientes sem DOM (SSR/tests).
 */
function generateCanvasFingerprint(): string {
  if (typeof document === 'undefined') {
    return '';
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device Fingerprint', 4, 17);

    return canvas.toDataURL();
  } catch (error) {
    console.warn('Erro ao gerar canvas fingerprint:', error);
    return '';
  }
}

/**
 * Coleta dados do Battery API
 */
async function collectBatteryData(): Promise<{ level?: number; charging?: boolean }> {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as { getBattery: () => Promise<{ level: number; charging: boolean }> }).getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
      };
    }
  } catch (error) {
    console.warn('Battery API não disponível:', error);
  }
  return {};
}

/**
 * Coleta lista de plugins instalados
 */
function collectPlugins(): string[] {
  try {
    if (navigator.plugins && navigator.plugins.length > 0) {
      return Array.from(navigator.plugins)
        .slice(0, 10)
        .map((p) => p.name);
    }
  } catch (error) {
    console.warn('Erro ao coletar plugins:', error);
  }
  return [];
}

/**
 * Coleta device fingerprint completo.
 *
 * Retorna objeto com dados técnicos do dispositivo para auditoria jurídica.
 * Não bloqueia em caso de falha - retorna campos como undefined.
 * Em ambientes SSR/tests (sem window, navigator ou screen), retorna objeto vazio.
 *
 * @returns Promise com dados do dispositivo
 *
 * @example
 * const fingerprint = await collectDeviceFingerprint();
 * console.log(fingerprint.screen_resolution); // "1920x1080"
 */
export async function collectDeviceFingerprint(): Promise<DeviceFingerprintData> {
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined' ||
    typeof screen === 'undefined'
  ) {
    return {};
  }

  try {
    const screenResolution = `${screen.width}x${screen.height}`;
    const colorDepth = screen.colorDepth;
    const timezoneOffset = new Date().getTimezoneOffset();
    const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const hardwareConcurrency = navigator.hardwareConcurrency;
    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const userAgent = navigator.userAgent;

    const batteryData = await collectBatteryData();
    const canvasData = generateCanvasFingerprint();
    const canvasHash = canvasData ? await generateHash(canvasData) : undefined;
    const plugins = collectPlugins();

    const fingerprint: DeviceFingerprintData = {
      screen_resolution: screenResolution,
      color_depth: colorDepth,
      timezone_offset: timezoneOffset,
      timezone_name: timezoneName,
      language,
      platform,
      hardware_concurrency: hardwareConcurrency,
      device_memory: deviceMemory,
      battery_level: batteryData.level,
      battery_charging: batteryData.charging,
      touch_support: touchSupport,
      user_agent: userAgent,
      canvas_hash: canvasHash,
      plugins: plugins.length > 0 ? plugins : undefined,
    };

    return fingerprint;
  } catch (error) {
    console.error('Erro crítico ao coletar device fingerprint:', error);
    try {
      return {
        screen_resolution: `${screen.width}x${screen.height}`,
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezone_offset: new Date().getTimezoneOffset(),
        color_depth: screen.colorDepth,
        touch_support: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      };
    } catch {
      return {};
    }
  }
}
