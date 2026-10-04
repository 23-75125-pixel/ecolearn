"use client";

import { useActionState } from "react";
import { updateTutorProfile, type TutorFormState } from "@/app/tutor/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ActionDialog } from "@/components/ui/action-dialog";
import { Save } from "lucide-react";
import { ICON_INLINE } from "@/lib/ui/styles";

export function ProfileEditor({ headline, bio }: { headline: string | null; bio: string | null }) {
  const [state, action, pending] = useActionState(updateTutorProfile, null as TutorFormState);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="headline">Public headline</Label>
        <Input id="headline" name="headline" defaultValue={headline ?? ""} placeholder="Math tutor for curious learners" />
      </div>
      <div>
        <Label htmlFor="bio">About your teaching</Label>
        <Textarea id="bio" name="bio" rows={4} defaultValue={bio ?? ""} />
      </div>
      {state?.error && <Alert>{state.error}</Alert>}
      <Button type="submit" size="sm" isLoading={pending}>
        {!pending && <Save className={ICON_INLINE} />}
        Save profile
      </Button>
      <ActionDialog error={state?.error} success={state?.success} />
    </form>
  );
}
