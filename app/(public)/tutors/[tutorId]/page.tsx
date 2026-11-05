import { notFound } from "next/navigation";
import { TutorProfileView } from "@/components/tutors/tutor-profile-view";
import { getOpenSlots, getPublicTutor } from "@/lib/queries/tutors";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validations/common";

export default async function PublicTutorProfilePage({ params }: { params: Promise<{ tutorId: string }> }) {
  const { tutorId } = await params;
  if (!uuidSchema.safeParse(tutorId).success) notFound();

  const supabase = await createClient();
  const tutor = await getPublicTutor(supabase, tutorId);
  if (!tutor) notFound();

  return <TutorProfileView tutor={tutor} slots={await getOpenSlots(supabase, tutorId)} canBook={false} />;
}
