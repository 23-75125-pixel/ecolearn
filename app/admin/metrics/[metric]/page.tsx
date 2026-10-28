import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { buttonClasses } from "@/components/ui/button";
import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
  ACTIVE_APPOINTMENT_STATUSES,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
} from "@/lib/constants/status";
import { createClient } from "@/lib/supabase/server";
import {
  DIVIDE,
  ICON_INLINE,
  ITEM_TITLE,
  SUBTEXT,
  TITLE,
} from "@/lib/ui/styles";
import {
  METRIC_LABELS,
  type MetricSlug,
} from "@/app/admin/dashboard/page";
import type {
  ApplicationStatus,
  AppointmentStatus,
} from "@/types/database.types";

const METRIC_SLUGS = Object.keys(METRIC_LABELS) as MetricSlug[];

export default async function AdminMetricPage({
  params,
}: {
  params: Promise<{ metric: string }>;
}) {
  const { metric } = await params;
  if (!METRIC_SLUGS.includes(metric as MetricSlug)) notFound();

  const slug = metric as MetricSlug;
  const supabase = await createClient();
  const result = await loadMetric(supabase, slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/admin/dashboard"
        className={buttonClasses({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className={ICON_INLINE} />
        Dashboard
      </Link>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <h1 className={TITLE}>{METRIC_LABELS[slug]}</h1>
          <p className={cnText("mt-1")}>
            {result.rows.length} {result.rows.length === 1 ? "record" : "records"} found
          </p>
        </div>
      </div>

      {result.error ? (
        <Alert className="mt-8">{result.error}</Alert>
      ) : result.rows.length === 0 ? (
        <Card className="mt-8">
          <p className={SUBTEXT}>There is no data to display for this metric yet.</p>
        </Card>
      ) : (
        <Card className="mt-8 overflow-x-auto p-0">
          <div
            role="table"
            aria-label={`${METRIC_LABELS[slug]} data`}
            className="min-w-[34rem]"
          >
            <div
              role="row"
              className="grid grid-cols-[minmax(12rem,1.3fr)_minmax(14rem,2fr)_minmax(7rem,0.7fr)] gap-4 border-b border-zinc-300 px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            >
              <span role="columnheader">Profile</span>
              <span role="columnheader">Information</span>
              <span role="columnheader">Status / date</span>
            </div>
            <ul role="rowgroup" className={DIVIDE}>
              {result.rows.map((row) => row.content)}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}

function cnText(className: string) {
  return `${SUBTEXT} ${className}`;
}

type MetricResult = {
  rows: { content: ReactNode; key: string }[];
  error: string | null;
};

async function loadMetric(
  supabase: Awaited<ReturnType<typeof createClient>>,
  metric: MetricSlug,
): Promise<MetricResult> {
  if (metric === "students" || metric === "tutor-accounts") {
    const role = metric === "students" ? "student" : "tutor";
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, created_at")
      .eq("role", role)
      .order("created_at", { ascending: false });
    const privateProfiles = await loadPrivateProfiles(
      supabase,
      (data ?? []).map((profile) => profile.id),
    );

    return {
      error: error?.message ?? null,
      rows: (data ?? []).map((profile) => ({
        key: profile.id,
        content: (
          <li role="row" key={profile.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(12rem,1.3fr)_minmax(14rem,2fr)_minmax(7rem,0.7fr)] sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  firstName={profile.first_name}
                  lastName={profile.last_name}
                  avatarUrl={profile.avatar_url}
                  size="sm"
                />
                <p className={ITEM_TITLE}>{profile.first_name} {profile.last_name}</p>
              </div>
              <p className={SUBTEXT}>
                {formatContact(privateProfiles.get(profile.id))}
              </p>
            </div>
            <p className={SUBTEXT}>Joined {formatDate(profile.created_at)}</p>
          </li>
        ),
      })),
    };
  }

  if (metric === "approved-tutors") {
    const { data, error } = await supabase
      .from("tutor_profiles")
      .select("id, profile_id, headline, created_at, profiles(first_name, last_name, avatar_url)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    const privateProfiles = await loadPrivateProfiles(
      supabase,
      (data ?? []).map((tutor) => tutor.profile_id),
    );

    return {
      error: error?.message ?? null,
      rows: (data ?? []).map((tutor) => {
        const profile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles;
        return {
          key: tutor.id,
          content: (
            <li role="row" key={tutor.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(12rem,1.3fr)_minmax(14rem,2fr)_minmax(7rem,0.7fr)] sm:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    firstName={profile?.first_name}
                    lastName={profile?.last_name}
                    avatarUrl={profile?.avatar_url}
                    size="sm"
                  />
                  <p className={ITEM_TITLE}>{profile?.first_name} {profile?.last_name}</p>
                </div>
                <p className={SUBTEXT}>
                  {formatContact(privateProfiles.get(tutor.profile_id))}
                  {tutor.headline ? ` · ${tutor.headline}` : ""}
                </p>
              </div>
              <p className={SUBTEXT}>Approved {formatDate(tutor.created_at)}</p>
            </li>
          ),
        };
      }),
    };
  }

  if (metric === "pending-applications" || metric === "rejected-applications") {
    const statuses: ApplicationStatus[] =
      metric === "pending-applications" ? ["pending", "under_review"] : ["rejected"];
    const { data, error } = await supabase
      .from("tutor_applications")
      .select("id, tutor_id, status, submitted_at, reviewed_at, review_notes")
      .in("status", statuses)
      .order("submitted_at", { ascending: false });
    const tutorIds = (data ?? []).map((application) => application.tutor_id);
    const { data: profiles } = tutorIds.length
      ? await supabase.from("profiles").select("id, first_name, last_name, avatar_url").in("id", tutorIds)
      : { data: [] };
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const privateProfiles = await loadPrivateProfiles(supabase, tutorIds);

    return {
      error: error?.message ?? null,
      rows: (data ?? []).map((application) => {
        const profile = profileById.get(application.tutor_id);
        return {
          key: application.id,
          content: (
            <li role="row" key={application.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(12rem,1.3fr)_minmax(14rem,2fr)_minmax(7rem,0.7fr)] sm:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    firstName={profile?.first_name}
                    lastName={profile?.last_name}
                    avatarUrl={profile?.avatar_url}
                    size="sm"
                  />
                  <p className={ITEM_TITLE}>{profile?.first_name} {profile?.last_name}</p>
                </div>
                <p className={SUBTEXT}>
                  {formatContact(privateProfiles.get(application.tutor_id))}
                </p>
                {application.review_notes && <p className={SUBTEXT}>Note: {application.review_notes}</p>}
              </div>
              <div className="text-right">
                <Badge tone={APPLICATION_STATUS_TONE[application.status]}>{APPLICATION_STATUS_LABEL[application.status]}</Badge>
                <p className={cnText("mt-1")}>{formatDate(application.submitted_at ?? application.reviewed_at)}</p>
              </div>
            </li>
          ),
        };
      }),
    };
  }

  if (metric === "availability") {
    const { data, error } = await supabase
      .from("availability")
      .select("id, tutor_profile_id, subject_id, day_date, start_time, end_time, slot_duration_minutes, notes")
      .order("day_date", { ascending: true })
      .order("start_time", { ascending: true });
    const tutorProfileIds = (data ?? []).map((item) => item.tutor_profile_id);
    const subjectIds = (data ?? [])
      .map((item) => item.subject_id)
      .filter((id): id is string => Boolean(id));
    const [{ data: tutors }, { data: subjects }] = await Promise.all([
      tutorProfileIds.length
        ? supabase.from("tutor_profiles").select("id, profile_id").in("id", tutorProfileIds)
        : { data: [] },
      subjectIds.length
        ? supabase.from("subjects").select("id, name").in("id", subjectIds)
        : { data: [] },
    ]);
    const profileIds = (tutors ?? []).map((tutor) => tutor.profile_id);
    const { data: profiles } = profileIds.length
      ? await supabase.from("profiles").select("id, first_name, last_name, avatar_url").in("id", profileIds)
      : { data: [] };
    const tutorById = new Map((tutors ?? []).map((tutor) => [tutor.id, tutor]));
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const subjectById = new Map((subjects ?? []).map((subject) => [subject.id, subject]));

    return {
      error: error?.message ?? null,
      rows: (data ?? []).map((item) => {
        const tutor = tutorById.get(item.tutor_profile_id);
        const profile = tutor ? profileById.get(tutor.profile_id) : null;
        return {
          key: item.id,
          content: (
            <li role="row" key={item.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(12rem,1.3fr)_minmax(14rem,2fr)_minmax(7rem,0.7fr)] sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar
                  firstName={profile?.first_name}
                  lastName={profile?.last_name}
                  avatarUrl={profile?.avatar_url}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className={ITEM_TITLE}>{profile?.first_name} {profile?.last_name}</p>
                  <p className={SUBTEXT}>
                    {item.day_date} · {item.start_time}–{item.end_time} · {item.slot_duration_minutes} minute slots
                  </p>
                  <p className={SUBTEXT}>{item.subject_id ? subjectById.get(item.subject_id)?.name ?? "Subject unavailable" : "Any subject"}</p>
                </div>
              </div>
              <Badge tone="success">Active</Badge>
            </li>
          ),
        };
      }),
    };
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("id, student_id, tutor_profile_id, status, created_at, slot_id")
    .in("status", ACTIVE_APPOINTMENT_STATUSES)
    .order("created_at", { ascending: false });
  const studentIds = (data ?? []).map((appointment) => appointment.student_id);
  const tutorIds = (data ?? []).map((appointment) => appointment.tutor_profile_id);
  const [{ data: students }, { data: tutors }, { data: slots }] = await Promise.all([
    studentIds.length ? supabase.from("profiles").select("id, first_name, last_name, avatar_url").in("id", studentIds) : { data: [] },
    tutorIds.length ? supabase.from("tutor_profiles").select("id, profile_id").in("id", tutorIds) : { data: [] },
    (data ?? []).length ? supabase.from("appointment_slots").select("id, slot_date, start_time, end_time").in("id", (data ?? []).map((appointment) => appointment.slot_id)) : { data: [] },
  ]);
  const studentById = new Map((students ?? []).map((student) => [student.id, student]));
  const tutorById = new Map((tutors ?? []).map((tutor) => [tutor.id, tutor]));
  const slotById = new Map((slots ?? []).map((slot) => [slot.id, slot]));
  const tutorProfileIds = (tutors ?? []).map((tutor) => tutor.profile_id);
  const { data: tutorProfiles } = tutorProfileIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, avatar_url").in("id", tutorProfileIds)
    : { data: [] };
  const tutorNameByProfileId = new Map(
    (tutorProfiles ?? []).map((profile) => [
      profile.id,
      `${profile.first_name} ${profile.last_name}`,
    ]),
  );

  return {
    error: error?.message ?? null,
    rows: (data ?? []).map((appointment) => {
      const student = studentById.get(appointment.student_id);
      const tutor = tutorById.get(appointment.tutor_profile_id);
      const slot = slotById.get(appointment.slot_id);
      return {
        key: appointment.id,
        content: (
          <li role="row" key={appointment.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(12rem,1.3fr)_minmax(14rem,2fr)_minmax(7rem,0.7fr)] sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  firstName={student?.first_name}
                  lastName={student?.last_name}
                  avatarUrl={student?.avatar_url}
                  size="sm"
                />
                <p className={ITEM_TITLE}>Student: {student?.first_name} {student?.last_name}</p>
              </div>
              <p className={SUBTEXT}>
                Tutor: {tutor ? tutorNameByProfileId.get(tutor.profile_id) ?? "Name unavailable" : "Tutor unavailable"}
              </p>
              <p className={SUBTEXT}>{slot ? `${slot.slot_date} · ${slot.start_time}–${slot.end_time}` : "Session time unavailable"}</p>
            </div>
            <Badge tone={APPOINTMENT_STATUS_TONE[appointment.status as AppointmentStatus]}>
              {APPOINTMENT_STATUS_LABEL[appointment.status as AppointmentStatus]}
            </Badge>
          </li>
        ),
      };
    }),
  };
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Date unavailable";
}

type PrivateProfile = { email: string; phone: string | null };

async function loadPrivateProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileIds: string[],
) {
  const entries = await Promise.all(
    [...new Set(profileIds)].map(async (profileId) => {
      const { data, error } = await supabase.rpc("get_private_profile", {
        p_profile_id: profileId,
      });
      if (error) return [profileId, null] as const;
      const privateProfile = data?.[0] ?? null;
      return [profileId, privateProfile] as const;
    }),
  );
  return new Map<string, PrivateProfile | null>(entries);
}

function formatContact(profile: PrivateProfile | null | undefined) {
  if (!profile) return "Contact details unavailable";
  return `${profile.email}${profile.phone ? ` · ${profile.phone}` : ""}`;
}
