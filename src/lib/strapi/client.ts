/**
 * Strapi 5 REST API Client
 * 
 * Cliente HTTP para consumir a API do Strapi CMS no Next.js.
 * Utilizado pelas páginas públicas de Insights (/website/insights).
 */

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN ?? '';

interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

// ============================================================
// Types — espelham o content-type "blog-post" do Strapi
// ============================================================

export interface StrapiBlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string[];
  authorName: string;
  readTime: number;
  coverUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Helpers
// ============================================================

function strapiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
  };
}

async function strapiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const url = new URL(`${STRAPI_URL}/api/${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const res = await fetch(url.toString(), {
    headers: strapiHeaders(),
    next: { revalidate: 3600 }, // ISR — 1 hora
  });

  if (!res.ok) {
    throw new Error(
      `Strapi API Error: ${res.status} ${res.statusText} — ${endpoint}`
    );
  }

  return res.json() as Promise<T>;
}

// ============================================================
// API Functions
// ============================================================

/**
 * Lista todos os blog posts publicados
 */
export async function listarPostsPublicados(
  pagina = 1,
  limite = 10,
  categoria?: string
): Promise<{ posts: StrapiBlogPost[]; total: number }> {
  const params: Record<string, string | number | boolean> = {
    'pagination[page]': pagina,
    'pagination[pageSize]': limite,
    sort: 'publishedAt:desc',
    'status': 'published',
  };

  if (categoria) {
    params['filters[category][$eq]'] = categoria;
  }

  const response = await strapiGet<StrapiListResponse<StrapiBlogPost>>(
    'blog-posts',
    params
  );

  return {
    posts: response.data,
    total: response.meta.pagination.total,
  };
}

/**
 * Busca um único post pelo slug
 */
export async function buscarPostPorSlug(
  slug: string
): Promise<StrapiBlogPost | null> {
  const response = await strapiGet<StrapiListResponse<StrapiBlogPost>>(
    'blog-posts',
    {
      'filters[slug][$eq]': slug,
      'status': 'published',
    }
  );

  return response.data[0] ?? null;
}

/**
 * Busca todos os slugs publicados (para generateStaticParams)
 */
export async function listarSlugsPosts(): Promise<string[]> {
  const response = await strapiGet<StrapiListResponse<Pick<StrapiBlogPost, 'slug'>>>(
    'blog-posts',
    {
      'fields[0]': 'slug',
      'status': 'published',
      'pagination[pageSize]': 100,
    }
  );

  return response.data.map((p) => p.slug);
}

/**
 * Formata data para exibição em PT-BR
 */
export function formatarDataPost(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString));
}
