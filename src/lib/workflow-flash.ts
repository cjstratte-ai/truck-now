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
