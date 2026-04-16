export type FlashNotice = {
  tone: "success" | "error";
  text: string;
};

const flashMessages: Record<string, FlashNotice> = {
  "booking-request-created": {
    tone: "success",
    text: "Booking request sent. It is now waiting in the workflow for review, and the operator notification is queued.",
  },
  "booking-request-demo": {
    tone: "success",
    text: "Booking request captured in demo mode. Connect a database to persist it.",
  },
  "booking-request-missing-fields": {
    tone: "error",
    text: "Please fill out your name, email, and rental dates before sending the request.",
  },
  "booking-request-invalid-dates": {
    tone: "error",
    text: "Those rental dates do not look valid. Please check them and try again.",
  },
  "booking-request-past-date": {
    tone: "error",
    text: "Booking requests need a future start date.",
  },
  "booking-request-conflict": {
    tone: "error",
    text: "That truck already has a conflicting request or booking for those dates.",
  },
  "booking-request-unavailable": {
    tone: "error",
    text: "That listing is not currently available for requests.",
  },
  "booking-request-failed": {
    tone: "error",
    text: "The booking request did not go through. Please try again.",
  },
  "listing-approved": {
    tone: "success",
    text: "Listing approved and ready to move live.",
  },
  "listing-approved-demo": {
    tone: "success",
    text: "Listing approval ran in demo mode. Connect a database to persist it.",
  },
  "listing-rejected": {
    tone: "success",
    text: "Listing sent back out of the approval lane.",
  },
  "listing-rejected-demo": {
    tone: "success",
    text: "Listing rejection ran in demo mode. Connect a database to persist it.",
  },
  "listing-review-failed": {
    tone: "error",
    text: "The listing review action failed. Please try again.",
  },
  "listing-saved": {
    tone: "success",
    text: "Listing changes saved.",
  },
  "listing-saved-demo": {
    tone: "success",
    text: "Listing edit ran in demo mode. Connect a database to persist it.",
  },
  "listing-submitted": {
    tone: "success",
    text: "Listing updated and sent back into the approval queue.",
  },
  "listing-submitted-demo": {
    tone: "success",
    text: "Listing submit-for-review ran in demo mode. Connect a database to persist it.",
  },
  "listing-save-invalid": {
    tone: "error",
    text: "Please fill out the title, description, location, and daily rate before saving the listing.",
  },
  "listing-save-failed": {
    tone: "error",
    text: "The listing changes did not save. Please try again.",
  },
  "listing-created": {
    tone: "success",
    text: "Listing created and saved as a draft.",
  },
  "listing-created-demo": {
    tone: "success",
    text: "Listing creation ran in demo mode. Connect a database to persist it.",
  },
  "listing-created-submitted": {
    tone: "success",
    text: "Listing created and sent into the approval queue.",
  },
  "listing-created-submitted-demo": {
    tone: "success",
    text: "Listing creation and review submission ran in demo mode. Connect a database to persist it.",
  },
  "listing-create-failed": {
    tone: "error",
    text: "The new listing could not be created. Please try again.",
  },
  "listing-archived": {
    tone: "success",
    text: "Listing archived and removed from the active workflow.",
  },
  "listing-archived-demo": {
    tone: "success",
    text: "Listing archive ran in demo mode. Connect a database to persist it.",
  },
  "listing-restored": {
    tone: "success",
    text: "Listing restored to draft so it can be updated and resubmitted.",
  },
  "listing-restored-demo": {
    tone: "success",
    text: "Listing restore ran in demo mode. Connect a database to persist it.",
  },
  "booking-approved": {
    tone: "success",
    text: "Booking approved. Customer payment and next-step notifications are now ready.",
  },
  "booking-approved-demo": {
    tone: "success",
    text: "Booking approval ran in demo mode. Connect a database to persist it.",
  },
  "booking-rejected": {
    tone: "success",
    text: "Booking rejected and the customer-facing update is ready.",
  },
  "booking-rejected-demo": {
    tone: "success",
    text: "Booking rejection ran in demo mode. Connect a database to persist it.",
  },
  "booking-paid": {
    tone: "success",
    text: "Booking marked paid. The handoff notification is now ready.",
  },
  "booking-paid-demo": {
    tone: "success",
    text: "Booking payment update ran in demo mode. Connect a database to persist it.",
  },
  "booking-status-failed": {
    tone: "error",
    text: "The booking status action failed. Please try again.",
  },
  "verification-approved": {
    tone: "success",
    text: "Verification approved. The booking can keep moving cleanly through the workflow.",
  },
  "verification-approved-demo": {
    tone: "success",
    text: "Verification approval ran in demo mode. Connect a database to persist it.",
  },
  "verification-rejected": {
    tone: "success",
    text: "Verification rejected.",
  },
  "verification-rejected-demo": {
    tone: "success",
    text: "Verification rejection ran in demo mode. Connect a database to persist it.",
  },
  "verification-status-failed": {
    tone: "error",
    text: "The verification action failed. Please try again.",
  },
};

export function getWorkflowFlash(message: string | string[] | undefined): FlashNotice | null {
  if (!message) {
    return null;
  }

  const key = Array.isArray(message) ? message[0] : message;

  return flashMessages[key] ?? null;
}

export function getFlashClasses(tone: FlashNotice["tone"]) {
  return tone === "success"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : "border-rose-500/30 bg-rose-500/10 text-rose-200";
}
