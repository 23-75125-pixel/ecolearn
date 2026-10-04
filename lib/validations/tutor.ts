import { z } from "zod";
import { emptyToUndefined } from "@/lib/validations/common";

export const SLOT_DURATIONS = [30, 45, 60, 90] as const;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

export const availabilitySchema = z
  .object({
    dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose an end time."),
    duration: z.coerce
      .number()
      .refine((value) => (SLOT_DURATIONS as readonly number[]).includes(value), "Choose a slot length."),
    subjectId: z.preprocess(emptyToUndefined, z.uuid().optional()),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "The end time must be after the start time.",
    path: ["endTime"],
  });

export const profileSchema = z.object({
  headline: optionalText(150),
  bio: optionalText(2000),
});

export const reviewReasonSchema = z.string().trim().max(1000, "Keep the reason under 1000 characters.");
export const noteSchema = z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional());
