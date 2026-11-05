import { z } from "zod";
import { emptyToUndefined } from "@/lib/validations/common";

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

/** Session lengths a tutor can choose, in minutes. */
export const SLOT_LENGTH_OPTIONS = [30, 45, 60, 90, 120] as const;

/** Online meeting links must be https, with no spaces (the database checks the same rule). */
const MEETING_URL = /^https:\/\/[^\s]+$/;

export const availabilitySchema = z
  .object({
    dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose an end time."),
    duration: z.coerce
      .number()
      .refine((value) => (SLOT_LENGTH_OPTIONS as readonly number[]).includes(value), "Choose a session length."),
    sessionMode: z.enum(["online", "in_person"], { error: "Choose how the session will be held." }),
    meetingUrl: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(500, "The meeting link is too long.").regex(MEETING_URL, "Enter a meeting link that starts with https://.").optional(),
    ),
    location: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(3, "Enter where the session will take place.").max(200, "The location must be 200 characters or fewer.").optional(),
    ),
    subjectId: z.preprocess(emptyToUndefined, z.uuid().optional()),
  })
  .superRefine((data, ctx) => {
    const windowMinutes = getTimeDifferenceMinutes(data.startTime, data.endTime);
    if (windowMinutes <= 0) {
      ctx.addIssue({ code: "custom", message: "The end time must be after the start time.", path: ["endTime"] });
    } else if (windowMinutes % data.duration !== 0) {
      ctx.addIssue({
        code: "custom",
        message: `The window must fit whole ${data.duration}-minute sessions (for example, ${data.duration} or ${data.duration * 2} minutes long).`,
        path: ["endTime"],
      });
    }
    if (data.sessionMode === "online" && !data.meetingUrl) {
      ctx.addIssue({ code: "custom", message: "Enter the meeting link students will use.", path: ["meetingUrl"] });
    }
    if (data.sessionMode === "in_person" && !data.location) {
      ctx.addIssue({ code: "custom", message: "Enter where the session will take place.", path: ["location"] });
    }
  });

function getTimeDifferenceMinutes(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}

export const profileSchema = z.object({
  headline: optionalText(150),
  bio: optionalText(2000),
});

export const reviewReasonSchema = z.string().trim().max(1000, "Keep the reason under 1000 characters.");
/** Free text typed by a user (booking notes, cancellation reasons): optional, at most 1000 characters. */
export const noteSchema = z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional());
