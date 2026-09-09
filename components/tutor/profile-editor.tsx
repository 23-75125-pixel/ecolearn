"use client";

import { useActionState } from "react";
import { updateTutorProfile, type TutorFormState } from "@/app/tutor/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionDialog } from "@/components/ui/action-dialog";

export function ProfileEditor({ headline, bio }: { headline: string | null; bio: string | null }) {
  const [state, action, pending] = useActionState(updateTutorProfile, null as TutorFormState);
  return <form action={action} className="space-y-4"><div><Label htmlFor="headline">Public headline</Label><Input id="headline" name="headline" defaultValue={headline ?? ""} placeholder="Math tutor for curious learners" /></div><div><Label htmlFor="bio">About your teaching</Label><textarea id="bio" name="bio" rows={4} defaultValue={bio ?? ""} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" /></div>{state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}<Button type="submit" size="sm" isLoading={pending}>Save profile</Button><ActionDialog error={state?.error} success={state?.success} /></form>;
}