import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

interface ArticleCardProps {
  title: string;
  description?: string;
  category: string;
  date?: string;
  readTime?: string;
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
  /** Featured = large with image overlay, standard = compact */
  variant?: "featured" | "standard";
  className?: string;
}

/**
 * Article/Insight card from the editorial grid pattern.
 * Featured variant uses image overlay; standard variant is compact text.
 */
export function ArticleCard({
  title,
  description,
  category,
  date,
  readTime,
  imageSrc,
  imageAlt,
  href = "#",
  variant = "standard",
  className,
}: ArticleCardProps) {
  if (variant === "featured") {
    return (
      <a
        href={href}
        className={cn(
          "group relative overflow-hidden rounded-xl bg-surface-container border border-white/5 block",
          className
        )}
      >
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={imageAlt || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              {category}
            </span>
            {readTime && (
              <span className="text-on-surface-variant text-sm">
                {readTime}
              </span>
            )}
          </div>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface mb-4 group-hover:text-primary transition-colors">
            {title}
          </h2>
          {description && (
            <p className="text-on-surface-variant mb-6 line-clamp-2 max-w-xl">
              {description}
            </p>
          )}
          <span className="flex items-center gap-2 text-on-surface font-bold">
            Ler Artigo Completo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </a>
    );
  }

  return (
    <a
      href={href}
      className={cn(
        "bg-surface-container border border-white/5 p-8 rounded-xl group hover:border-primary/30 transition-all block",
        className
      )}
    >
      <span className="text-primary font-bold text-xs uppercase mb-3 block">
        {category}
      </span>
      <h3 className="font-headline text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
        {title}
      </h3>
      {description && (
        <p className="text-on-surface-variant text-sm mb-4">{description}</p>
      )}
      {date && (
        <div className="flex justify-between items-center text-xs text-on-surface-variant">
          <span>{date}</span>
        </div>
      )}
    </a>
  );
}
