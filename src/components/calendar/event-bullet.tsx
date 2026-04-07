import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { transition } from "@/components/ui/animations";
import type { TEventColor } from "@/components/calendar/types";

const eventBulletVariants = cva("size-2 rounded-full", {
	variants: {
		color: {
			blue: "bg-info dark:bg-info",
			green: "bg-success dark:bg-success",
			red: "bg-destructive dark:bg-destructive",
			yellow: "bg-warning dark:bg-warning",
			purple: "bg-primary dark:bg-primary",
			orange: "bg-warning dark:bg-warning",
			gray: "bg-muted-foreground",
		},
	},
	defaultVariants: {
		color: "blue",
	},
});

export function EventBullet({
	color,
	className,
}: {
	color: TEventColor;
	className?: string;
}) {
	return (
		<motion.div
			className={cn(eventBulletVariants({ color, className }))}
			initial={{ scale: 0, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			whileHover={{ scale: 1.2 }}
			transition={transition}
		/>
	);
}
