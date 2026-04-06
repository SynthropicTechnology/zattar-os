import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';
import {
  buscarPostPorSlug,
  listarSlugsPosts,
  formatarDataPost,
} from '@/lib/strapi/client';
import { WebsiteShell } from '../../components/layout/website-shell';

interface Props {
  params: Promise<{ slug: string }>;
}

// ISR — revalida a cada 1 hora
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const slugs = await listarSlugsPosts();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await buscarPostPorSlug(slug);
    if (!post) return { title: 'Post não encontrado' };

    return {
      title: `${post.title} | Insights Zattar Advogados`,
      description: post.excerpt ?? post.subtitle ?? undefined,
      openGraph: {
        title: post.title,
        description: post.excerpt ?? post.subtitle ?? undefined,
        type: 'article',
        publishedTime: post.publishedAt ?? undefined,
        authors: [post.authorName],
        ...(post.coverUrl && { images: [post.coverUrl] }),
      },
    };
  } catch {
    return { title: 'Insights | Zattar Advogados' };
  }
}

export default async function InsightsArtigoPage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = await buscarPostPorSlug(slug);
  } catch {
    // Strapi offline — fallback elegante
    post = null;
  }

  if (!post) {
    notFound();
  }

  const dataPublicacao = post.publishedAt
    ? formatarDataPost(post.publishedAt)
    : null;

  return (
    <WebsiteShell>
      <div className="pt-32">
        {/* Hero do Artigo */}
        <section className="relative pt-16 pb-12 px-6 md:px-12 max-w-5xl mx-auto">
          {/* Luzes atmosféricas */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary-dim/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10">
            {/* Voltar */}
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium mb-10 group"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
              Voltar para Insights
            </Link>

            {/* Categoria */}
            <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-6 inline-block uppercase tracking-wider">
              {post.category}
            </span>

            {/* Título */}
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[1.1] mb-6 mt-4">
              {post.title}
            </h1>

            {/* Subtítulo */}
            {post.subtitle && (
              <p className="text-on-surface-variant text-xl leading-relaxed max-w-3xl mb-8">
                {post.subtitle}
              </p>
            )}

            {/* Metadados */}
            <div className="flex flex-wrap items-center gap-6 text-on-surface-variant text-sm pb-8 border-b border-white/5">
              <span className="font-semibold text-on-surface">{post.authorName}</span>

              {dataPublicacao && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  {dataPublicacao}
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />
                {post.readTime} min de leitura
              </span>

              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="size-4" />
                  {(post.tags as string[]).map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full text-xs border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cover */}
        {post.coverUrl && (
          <div className="max-w-5xl mx-auto px-6 md:px-12 mb-12">
            <div className="aspect-video rounded-3xl overflow-hidden bg-surface-container-highest border border-white/5">
              <img
                src={post.coverUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <article className="max-w-3xl mx-auto px-6 md:px-12 pb-24">
          <div className="prose prose-invert prose-lg max-w-none
            prose-headings:font-headline prose-headings:text-on-surface prose-headings:tracking-tight
            prose-p:text-on-surface-variant prose-p:leading-relaxed
            prose-strong:text-on-surface
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-primary/50 prose-blockquote:text-on-surface-variant
            prose-code:text-primary prose-code:bg-surface-container prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-surface-container-highest prose-pre:border prose-pre:border-white/5
            prose-img:rounded-2xl
            prose-hr:border-white/10
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* CTA de contato */}
          <div className="mt-16 p-10 bg-surface-container rounded-3xl border border-primary/20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary to-transparent" />
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">
              Precisa de assessoria jurídica?
            </h2>
            <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
              Nossa equipe está pronta para analisar o seu caso e oferecer a solução mais adequada.
            </p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 bg-primary text-on-primary-fixed px-8 py-4 rounded-full font-bold hover:bg-primary/90 transition-colors"
            >
              Falar com Especialista
            </Link>
          </div>
        </article>
      </div>
    </WebsiteShell>
  );
}
