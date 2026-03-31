// @ts-check
/**
 * Custom Cache Handler para Next.js
 *
 * Persiste o cache ISR/fetch em disco em vez de apenas memoria.
 * No Cloudron, /app/data e persistente entre deploys; em dev/Docker, usa .next/cache/custom.
 *
 * Referencia: https://nextjs.org/docs/app/api-reference/next-config-js/cacheHandler
 */

const fs = require("fs");
const path = require("path");

const CACHE_DIR =
  process.env.CLOUDRON === "1"
    ? "/app/data/cache/next-custom"
    : path.join(process.cwd(), ".next", "cache", "custom");

const DEBUG = process.env.BUILD_CACHE_DEBUG === "true";

function log(/** @type {string} */ msg) {
  if (DEBUG) {
    console.log(`[CacheHandler] ${msg}`);
  }
}

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCachePath(/** @type {string} */ key) {
  // Sanitizar a key para usar como nome de arquivo
  const sanitized = key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 200);
  const hash = Buffer.from(key).toString("base64url").slice(0, 16);
  return path.join(CACHE_DIR, `${sanitized}-${hash}.json`);
}

/** @type {import('next/dist/server/lib/cache-handlers/types').CacheHandler} */
module.exports = class CacheHandler {
  constructor() {
    ensureCacheDir();
    log(`Inicializado em ${CACHE_DIR}`);
  }

  async get(/** @type {string} */ key) {
    const filePath = getCachePath(key);

    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const entry = JSON.parse(raw);

      // Verificar se o cache expirou
      if (entry.revalidatedAt && entry.expireAt) {
        if (Date.now() > entry.expireAt) {
          log(`MISS (expirado): ${key}`);
          fs.unlinkSync(filePath);
          return null;
        }
      }

      log(`HIT: ${key}`);
      return entry;
    } catch {
      log(`MISS: ${key}`);
      return null;
    }
  }

  async set(/** @type {string} */ key, /** @type {any} */ value) {
    const filePath = getCachePath(key);

    try {
      ensureCacheDir();
      const entry = {
        ...value,
        revalidatedAt: Date.now(),
      };
      fs.writeFileSync(filePath, JSON.stringify(entry));
      log(`SET: ${key}`);
    } catch (err) {
      console.error(`[CacheHandler] Erro ao salvar cache para ${key}:`, err);
    }
  }

  async delete(/** @type {string} */ key) {
    const filePath = getCachePath(key);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log(`DELETE: ${key}`);
      }
    } catch (err) {
      console.error(`[CacheHandler] Erro ao deletar cache para ${key}:`, err);
    }
  }
};
