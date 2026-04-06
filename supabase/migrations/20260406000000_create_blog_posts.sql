-- ============================================================
-- Blog Posts para CMS do website da Zattar Advogados
-- Criado em: 2026-04-06
-- ============================================================

CREATE TABLE public.blog_posts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL CHECK (char_length(title) > 0),
  subtitle     text,
  content      text NOT NULL DEFAULT '',
  excerpt      text,
  cover_url    text,
  category     text NOT NULL DEFAULT 'Geral',
  tags         text[] NOT NULL DEFAULT '{}',
  author_name  text NOT NULL DEFAULT 'Equipe Zattar Advogados',
  read_time    int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_blog_posts_slug        ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published   ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_posts_category    ON public.blog_posts(category);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anônimos: somente posts publicados
CREATE POLICY "blog_posts_public_read"
  ON public.blog_posts
  FOR SELECT
  TO anon
  USING (is_published = true);

-- Autenticados (equipe interna): acesso total
CREATE POLICY "blog_posts_authenticated_all"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
