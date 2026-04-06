import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  tags?: string[];
  href?: string;
  /** Span 2 columns in a 3-col grid */
  wide?: boolean;
  className?: string;
}

/**
 * Feature/Solution card from the bento grid pattern.
 * Supports wide (2-col span) and normal variants.
 */
export function FeatureCard({
  icon,
  title,
  description,
  tags,
  href,
  wide = false,
  className,
}: FeatureCardProps) {
  return (
    <div className={cn(wide && "md:col-span-2", "group")}>
      <div
        className={cn(
          "h-full bg-surface-container rounded-3xl p-8 border border-white/5",
          "hover:border-primary/30 transition-all duration-500 flex flex-col",
          className
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          {icon}
        </div>

        <h3
          className={cn(
            "font-headline font-bold text-on-surface mb-4",
            wide ? "text-3xl" : "text-2xl"
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "text-on-surface-variant leading-relaxed",
            wide ? "text-lg max-w-md" : ""
          )}
        >
          {description}
        </p>

        {tags && tags.length > 0 && (
          <div className="mt-auto pt-8 flex flex-wrap gap-3">
            {tags.map((tag) => (
              <span key={tag} className="chip-legal text-xs tracking-wider uppercase">
                {tag}
              </span>
            ))}
          </div>
        )}

        {href && !tags?.length && (
          <div className="mt-auto pt-8">
            <a
              href={href}
              className="text-primary font-bold flex items-center gap-2 group-hover:gap-4 transition-all"
            >
              Explorar
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
