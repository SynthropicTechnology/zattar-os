import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { differenceInMinutes, parseISO } from "date-fns";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/components/calendar/calendar-context";
import { EventDetailsDialog } from "@/components/calendar/event-details-dialog";
import { DraggableEvent } from "@/components/calendar/draggable-event";
import { ResizableEvent } from "@/components/calendar/resizable-event";
import { formatTime } from "@/components/calendar/helpers";
import type { IEvent } from "@/components/calendar/interfaces";

const calendarWeekEventCardVariants = cva(
	"flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-2 py-1.5 text-xs focus-visible:outline-offset-2",
	{
		variants: {
			color: {
				// Colored variants
				blue: "border-info bg-info/50 text-info hover:bg-info dark:border-info dark:bg-info/50 dark:text-info dark:hover:bg-info",
				green:
					"border-success bg-success/50 text-success hover:bg-success dark:border-success dark:bg-success/50 dark:text-success dark:hover:bg-success",
				red: "border-destructive bg-destructive/50 text-destructive hover:bg-destructive dark:border-destructive dark:bg-destructive/50 dark:text-destructive dark:hover:bg-destructive",
				yellow:
					"border-warning bg-warning/50 text-warning hover:bg-warning dark:border-warning dark:bg-warning/50 dark:text-warning dark:hover:bg-warning",
				purple:
					"border-primary bg-primary/50 text-primary hover:bg-primary dark:border-primary dark:bg-primary/50 dark:text-primary dark:hover:bg-primary",
				orange:
					"border-warning bg-warning/50 text-warning hover:bg-warning dark:border-warning dark:bg-warning/50 dark:text-warning dark:hover:bg-warning",

				// Dot variants
				"blue-dot":
					"border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-info dark:[&_svg]:fill-info",
				"green-dot":
					"border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-success dark:[&_svg]:fill-success",
				"red-dot":
					"border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-destructive dark:[&_svg]:fill-destructive",
				"orange-dot":
					"border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-warning dark:[&_svg]:fill-warning",
				"purple-dot":
					"border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-primary dark:[&_svg]:fill-primary",
			},
		},
		defaultVariants: {
			color: "blue-dot",
		},
	},
);

interface IProps
	extends HTMLAttributes<HTMLDivElement>,
		Omit<VariantProps<typeof calendarWeekEventCardVariants>, "color"> {
	event: IEvent;
}

export function EventBlock({ event, className }: IProps) {
	const { badgeVariant, use24HourFormat } = useCalendar();

	const start = parseISO(event.startDate);
	const end = parseISO(event.endDate);
	const durationInMinutes = differenceInMinutes(end, start);
	const heightInPixels = (durationInMinutes / 60) * 96 - 8;

	const color = (
		badgeVariant === "dot" ? `${event.color}-dot` : event.color
	) as VariantProps<typeof calendarWeekEventCardVariants>["color"];

	const calendarWeekEventCardClasses = cn(
		calendarWeekEventCardVariants({ color, className }),
		durationInMinutes < 35 && "py-0 justify-center",
	);

	return (
		<ResizableEvent event={event}>
			<DraggableEvent event={event}>
				<EventDetailsDialog event={event}>
					<div
						role="button"
						tabIndex={0}
						className={calendarWeekEventCardClasses}
						style={{ height: `${heightInPixels}px` }}
					>
						<div className="flex items-center gap-1.5 truncate">
							{badgeVariant === "dot" && (
								<svg
									width="8"
									height="8"
									viewBox="0 0 8 8"
									className="shrink-0"
								>
									<circle cx="4" cy="4" r="4" />
								</svg>
							)}

							<p className="truncate font-semibold">{event.title}</p>
						</div>

						{durationInMinutes > 25 && (
							<p>
								{formatTime(start, use24HourFormat)} -{" "}
								{formatTime(end, use24HourFormat)}
							</p>
						)}
					</div>
				</EventDetailsDialog>
			</DraggableEvent>
		</ResizableEvent>
	);
}
