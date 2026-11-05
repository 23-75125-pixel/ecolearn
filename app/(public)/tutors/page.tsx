import { TutorDirectory } from "@/components/tutors/tutor-directory";
import { SUBTEXT, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { getDirectoryTutors } from "@/lib/queries/tutors";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_TUTORS_PATH } from "@/lib/constants/roles";

export default async function PublicTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string | string[] }>;
}) {
  const { subject } = await searchParams;
  const supabase = await createClient();
  const tutors = await getDirectoryTutors(supabase);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className={TITLE}>Find a tutor</h1>
      <p className={cn(SUBTEXT, "mt-1")}>Every tutor listed here has been reviewed and approved by an ECoLearn administrator.</p>
      <TutorDirectory
        tutors={tutors}
        basePath={PUBLIC_TUTORS_PATH}
        initialSubject={typeof subject === "string" ? subject : undefined}
      />
    </div>
  );
}
