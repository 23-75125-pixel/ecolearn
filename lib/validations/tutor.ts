import { z } from "zod";
import { emptyToUndefined } from "@/lib/validations/common";

<<<<<<< HEAD
=======
export const SLOT_DURATIONS = [30, 45, 60, 90] as const;

>>>>>>> origin/main
const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

export const availabilitySchema = z
  .object({
    dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose an end time."),
    duration: z.coerce
      .number()
<<<<<<< HEAD
      .int("Slot length must be a whole number of minutes.")
      .positive("Slot length must be greater than zero.")
      .max(1440, "Slot length cannot exceed one day."),
=======
      .refine((value) => (SLOT_DURATIONS as readonly number[]).includes(value), "Choose a slot length."),
>>>>>>> origin/main
    subjectId: z.preprocess(emptyToUndefined, z.uuid().optional()),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "The end time must be after the start time.",
    path: ["endTime"],
<<<<<<< HEAD
  })
  .refine(
    (data) => data.duration === getTimeDifferenceMinutes(data.startTime, data.endTime),
    {
      message: "Slot length must match the selected start and end times.",
      path: ["duration"],
    },
  );

function getTimeDifferenceMinutes(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}
=======
  });
>>>>>>> origin/main

export const profileSchema = z.object({
  headline: optionalText(150),
  bio: optionalText(2000),
});

export const reviewReasonSchema = z.string().trim().max(1000, "Keep the reason under 1000 characters.");
export const noteSchema = z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional());
