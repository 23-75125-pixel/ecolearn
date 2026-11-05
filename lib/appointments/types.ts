/** What an appointment button's Server Action returns: an error to show, or nothing when it worked. */
export type AppointmentActionState = { error?: string } | null;

export type AppointmentAction = (
  previous: AppointmentActionState,
  formData: FormData,
) => Promise<AppointmentActionState>;

/** The actions a list of appointments can offer. Missing ones are simply not shown. */
export type AppointmentHandlers = {
  cancel: AppointmentAction;
  confirm?: AppointmentAction;
  complete?: AppointmentAction;
  noShow?: AppointmentAction;
};
