/**
 * Testes Unitários para URLs
 *
 * Valida funções de geração de URLs dos apps Synthropic
 */

import { getDashboardUrl, getMeuProcessoUrl, getWebsiteUrl } from '@/lib/urls';

describe('URLs - Unit Tests', () => {
  describe('getDashboardUrl', () => {
    it('deve retornar URL base sem path', () => {
      expect(getDashboardUrl()).toBe('http://localhost:3000');
    });

    it('deve adicionar path com barra inicial', () => {
      expect(getDashboardUrl('/processos')).toBe('http://localhost:3000/processos');
    });

    it('deve adicionar path sem barra inicial', () => {
      expect(getDashboardUrl('processos')).toBe('http://localhost:3000/processos');
    });

    it('deve lidar com paths compostos', () => {
      expect(getDashboardUrl('/processos/123')).toBe('http://localhost:3000/processos/123');
    });

    it('deve lidar com query strings', () => {
      expect(getDashboardUrl('/processos?filter=active')).toBe('http://localhost:3000/processos?filter=active');
    });

    it('deve lidar com string vazia', () => {
      expect(getDashboardUrl('')).toBe('http://localhost:3000/');
    });
  });

  describe('getMeuProcessoUrl', () => {
    it('deve retornar URL base sem path', () => {
      expect(getMeuProcessoUrl()).toBe('http://localhost:3000/portal');
    });

    it('deve adicionar path com barra inicial', () => {
      expect(getMeuProcessoUrl('/processos')).toBe('http://localhost:3000/portal/processos');
    });

    it('deve adicionar path sem barra inicial', () => {
      expect(getMeuProcessoUrl('processos')).toBe('http://localhost:3000/portal/processos');
    });

    it('deve lidar com paths compostos', () => {
      expect(getMeuProcessoUrl('/login')).toBe('http://localhost:3000/portal/login');
    });

    it('deve lidar com hash fragments', () => {
      expect(getMeuProcessoUrl('/#dashboard')).toBe('http://localhost:3000/portal/#dashboard');
    });
  });

  describe('getWebsiteUrl', () => {
    it('deve retornar URL base sem path', () => {
      expect(getWebsiteUrl()).toBe('http://localhost:3000/website');
    });

    it('deve adicionar path com barra inicial', () => {
      expect(getWebsiteUrl('/sobre')).toBe('http://localhost:3000/website/sobre');
    });

    it('deve adicionar path sem barra inicial', () => {
      expect(getWebsiteUrl('sobre')).toBe('http://localhost:3000/website/sobre');
    });

    it('deve lidar com paths aninhados', () => {
      expect(getWebsiteUrl('/blog/post-123')).toBe('http://localhost:3000/website/blog/post-123');
    });
  });

  describe('Comportamento Consistente', () => {
    it('todas as funções devem adicionar barra quando path não tem barra', () => {
      expect(getDashboardUrl('test')).toContain('/test');
      expect(getMeuProcessoUrl('test')).toContain('/test');
      expect(getWebsiteUrl('test')).toContain('/test');
    });

    it('todas as funções devem usar path como está quando tem barra', () => {
      expect(getDashboardUrl('/test')).toContain('/test');
      expect(getMeuProcessoUrl('/test')).toContain('/test');
      expect(getWebsiteUrl('/test')).toContain('/test');
    });

    it('todas as funções devem retornar URL base sem trailing slash', () => {
      expect(getDashboardUrl().endsWith('/')).toBe(false);
      expect(getMeuProcessoUrl().endsWith('/portal/')).toBe(false);
      expect(getWebsiteUrl().endsWith('/website/')).toBe(false);
    });
  });

  describe('Casos Especiais', () => {
    it('deve lidar com paths com caracteres especiais', () => {
      expect(getDashboardUrl('/processos/número-123')).toBe('http://localhost:3000/processos/número-123');
      expect(getMeuProcessoUrl('/busca?q=teste%20123')).toBe('http://localhost:3000/portal/busca?q=teste%20123');
    });

    it('deve lidar com undefined como path', () => {
      expect(getDashboardUrl(undefined)).toBe('http://localhost:3000');
      expect(getMeuProcessoUrl(undefined)).toBe('http://localhost:3000/portal');
      expect(getWebsiteUrl(undefined)).toBe('http://localhost:3000/website');
    });
  });
});
