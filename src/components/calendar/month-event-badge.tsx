import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { endOfDay, isSameDay, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/components/calendar/calendar-context";
import { EventDetailsDialog } from "@/components/calendar/event-details-dialog";
import { DraggableEvent } from "@/components/calendar/draggable-event";
import { formatTime } from "@/components/calendar/helpers";
import type { IEvent } from "@/components/calendar/interfaces";
import {EventBullet} from "@/components/calendar/event-bullet";

const eventBadgeVariants = cva(
	"mx-1 flex size-auto h-6.5 select-none items-center justify-between gap-1.5 truncate whitespace-nowrap rounded-md border px-2 text-xs",
	{
		variants: {
			color: {
				// Colored variants
				blue: "border-info bg-info text-info dark:border-info dark:bg-info dark:text-info",
				green:
					"border-success bg-success text-success dark:border-success dark:bg-success dark:text-success",
				red: "border-destructive bg-destructive text-destructive dark:border-destructive dark:bg-destructive dark:text-destructive",
				yellow:
					"border-warning bg-warning text-warning dark:border-warning dark:bg-warning dark:text-warning",
				purple:
					"border-primary bg-primary text-primary dark:border-primary dark:bg-primary dark:text-primary",
				orange:
					"border-warning bg-warning text-warning dark:border-warning dark:bg-warning dark:text-warning",

				// Dot variants
				"blue-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-info",
				"green-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-success",
				"red-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-destructive",
				"orange-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-warning",
				"purple-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-primary",
			},
			multiDayPosition: {
				first:
					"relative z-10 mr-0 rounded-r-none border-r-0 [&>span]:mr-2.5",
				middle:
					"relative z-10 mx-0 w-[calc(100%_+_1px)] rounded-none border-x-0",
				last: "ml-0 rounded-l-none border-l-0",
				none: "",
			},
		},
		defaultVariants: {
			color: "blue-dot",
		},
	},
);

interface IProps
	extends Omit<
		VariantProps<typeof eventBadgeVariants>,
		"color" | "multiDayPosition"
	> {
	event: IEvent;
	cellDate: Date;
	eventCurrentDay?: number;
	eventTotalDays?: number;
	className?: string;
	position?: "first" | "middle" | "last" | "none";
}

export function MonthEventBadge({
	event,
	cellDate,
	eventCurrentDay,
	eventTotalDays,
	className,
	position: propPosition,
}: IProps) {
	const { badgeVariant, use24HourFormat } = useCalendar();

	const itemStart = startOfDay(parseISO(event.startDate));
	const itemEnd = endOfDay(parseISO(event.endDate));

	if (cellDate < itemStart || cellDate > itemEnd) return null;

	let position: "first" | "middle" | "last" | "none" | undefined;

	if (propPosition) {
		position = propPosition;
	} else if (eventCurrentDay && eventTotalDays) {
		position = "none";
	} else if (isSameDay(itemStart, itemEnd)) {
		position = "none";
	} else if (isSameDay(cellDate, itemStart)) {
		position = "first";
	} else if (isSameDay(cellDate, itemEnd)) {
		position = "last";
	} else {
		position = "middle";
	}

	const renderBadgeText = ["first", "none"].includes(position) ;
	const renderBadgeTime =  ["last", "none"].includes(position);

	const color = (
		badgeVariant === "dot" ? `${event.color}-dot` : event.color
	) as VariantProps<typeof eventBadgeVariants>["color"];

	const eventBadgeClasses = cn(
		eventBadgeVariants({ color, multiDayPosition: position, className }),
	);

	return (
		<DraggableEvent event={event}>
			<EventDetailsDialog event={event}>
				<div role="button" tabIndex={0} className={eventBadgeClasses}>
					<div className="flex items-center gap-1.5 truncate">
						{!["middle", "last"].includes(position) &&
							badgeVariant === "dot" && (
								<EventBullet color={event.color} />
							)}

						{renderBadgeText && (
							<p className="flex-1 truncate font-semibold">
								{eventCurrentDay && (
									<span className="text-xs">
										Day {eventCurrentDay} of {eventTotalDays} •{" "}
									</span>
								)}
								{event.title}
							</p>
						)}
					</div>

					<div className="hidden sm:block">
						{renderBadgeTime && (
							<span>
							{formatTime(new Date(event.startDate), use24HourFormat)}
						</span>
						)}
					</div>
				</div>
			</EventDetailsDialog>
		</DraggableEvent>
	);
}
