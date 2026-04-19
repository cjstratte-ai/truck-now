export type BookingWorkflowSnapshot = {
  listingTitle: string;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
  verificationStatus: string;
  paymentStatus: string;
  paymentCapturedAt: string | null;
  paymentReference: string | null;
  customerNotificationKind: string | null;
  customerNotificationState: string;
  customerNotificationSentAt: string | null;
  opsNotificationKind: string | null;
  opsNotificationState: string;
  opsNotificationSentAt: string | null;
};

export type NotificationPreview = {
  kind: string;
  audience: string;
  title: string;
  body: string;
  state: string;
  sentAt: string | null;
};

export type BookingWorkflowSummary = {
  tone: "warning" | "success" | "danger" | "neutral";
  title: string;
  detail: string;
  nextAction: string;
  owner: string;
};

export function getRentalDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

export function getCustomerNotificationKind(
  status: string,
  verificationStatus: string,
  existingKind?: string | null,
) {
  if (existingKind) {
    return existingKind;
  }

  if (verificationStatus === "REJECTED") {
    return "VERIFICATION_REJECTED";
  }

  if (status === "REQUESTED") {
    return "REQUEST_RECEIVED";
  }

  if (status === "APPROVED") {
    return "BOOKING_APPROVED";
  }

  if (status === "REJECTED") {
    return "BOOKING_REJECTED";
  }

  if (status === "PAID") {
    return "PAYMENT_CONFIRMED";
  }

  return "BOOKING_UPDATE";
}

export function getOpsNotificationKind(status: string, verificationStatus: string, existingKind?: string | null) {
  if (existingKind) {
    return existingKind;
  }

  if (verificationStatus === "REJECTED") {
    return "VERIFICATION_REJECTED";
  }

  if (verificationStatus === "PENDING") {
    return "VERIFICATION_REVIEW";
  }

  if (status === "REQUESTED") {
    return "REQUEST_REVIEW";
  }

  if (status === "APPROVED") {
    return "PAYMENT_FOLLOW_UP";
  }

  if (status === "REJECTED") {
    return "BOOKING_REJECTED";
  }

  if (status === "PAID") {
    return "HANDOFF_READY";
  }

  return "WORKFLOW_UPDATE";
}

export function getNotificationFlowForNewRequest(now: Date) {
  return {
    customerNotificationKind: "REQUEST_RECEIVED",
    customerNotificationState: "SENT",
    customerNotificationSentAt: now,
    opsNotificationKind: "REQUEST_REVIEW",
    opsNotificationState: "PENDING",
    opsNotificationSentAt: null,
  } as const;
}

export function getNotificationFlowForBookingStatus(nextStatus: string) {
  if (nextStatus === "APPROVED") {
    return {
      customerNotificationKind: "BOOKING_APPROVED",
      customerNotificationState: "PENDING",
      customerNotificationSentAt: null,
      opsNotificationKind: "PAYMENT_FOLLOW_UP",
      opsNotificationState: "PENDING",
      opsNotificationSentAt: null,
    } as const;
  }

  if (nextStatus === "REJECTED") {
    return {
      customerNotificationKind: "BOOKING_REJECTED",
      customerNotificationState: "PENDING",
      customerNotificationSentAt: null,
      opsNotificationKind: "BOOKING_REJECTED",
      opsNotificationState: "PENDING",
      opsNotificationSentAt: null,
    } as const;
  }

  if (nextStatus === "PAID") {
    return {
      customerNotificationKind: "PAYMENT_CONFIRMED",
      customerNotificationState: "PENDING",
      customerNotificationSentAt: null,
      opsNotificationKind: "HANDOFF_READY",
      opsNotificationState: "PENDING",
      opsNotificationSentAt: null,
    } as const;
  }

  return {
    customerNotificationKind: "BOOKING_UPDATE",
    customerNotificationState: "PENDING",
    customerNotificationSentAt: null,
    opsNotificationKind: "WORKFLOW_UPDATE",
    opsNotificationState: "PENDING",
    opsNotificationSentAt: null,
  } as const;
}

export function getNotificationFlowForVerificationStatus(nextStatus: string) {
  if (nextStatus === "APPROVED") {
    return {
      opsNotificationKind: "OPERATOR_REVIEW_READY",
      opsNotificationState: "PENDING",
      opsNotificationSentAt: null,
    } as const;
  }

  return {
    customerNotificationKind: "VERIFICATION_REJECTED",
    customerNotificationState: "PENDING",
    customerNotificationSentAt: null,
    opsNotificationKind: "VERIFICATION_REJECTED",
    opsNotificationState: "PENDING",
    opsNotificationSentAt: null,
  } as const;
}

export function getPaymentSummary(booking: BookingWorkflowSnapshot) {
  const rentalDays = getRentalDays(booking.startDate, booking.endDate);
  const platformFee = Math.round(booking.totalAmount * 0.1);
  const operatorPayout = booking.totalAmount - platformFee;

  if (booking.paymentStatus === "CAPTURED") {
    return {
      rentalDays,
      platformFee,
      operatorPayout,
      label: "Payment captured",
      note: booking.paymentReference
        ? `Payment is captured and tied to reference ${booking.paymentReference}. The operator can move into handoff planning.`
        : "Payment is captured and ready for handoff planning.",
    };
  }

  if (booking.paymentStatus === "PENDING_CAPTURE") {
    return {
      rentalDays,
      platformFee,
      operatorPayout,
      label: "Payment ready",
      note: "The booking is approved and waiting for payment capture before the rental starts.",
    };
  }

  return {
    rentalDays,
    platformFee,
    operatorPayout,
    label: "Payment blocked",
    note: "Payment is not ready yet. Finish the booking and verification workflow before collecting funds.",
  };
}

export function getBookingWorkflowSummary(booking: BookingWorkflowSnapshot): BookingWorkflowSummary {
  if (booking.verificationStatus === "REJECTED") {
    return {
      tone: "danger",
      title: "Workflow blocked by verification",
      detail: "Verification was rejected, so the booking should stay out of approval and payment until that blocker is resolved or the rejection is confirmed.",
      nextAction:
        booking.customerNotificationState === "PENDING"
          ? "Send the customer-facing verification update, then decide whether this booking should stay closed or be reopened with new documents."
          : "Confirm the rejection path and only reopen the booking if new verification documents arrive.",
      owner: "Admin / Ops",
    };
  }

  if (booking.status === "REJECTED") {
    return {
      tone: "danger",
      title: "Booking closed",
      detail: "This booking has been rejected and is no longer moving toward payment or handoff.",
      nextAction:
        booking.customerNotificationState === "PENDING" || booking.opsNotificationState === "PENDING"
          ? "Send the queued rejection updates so the customer and ops lanes match the booking record."
          : "Use the timeline as the source of truth and reopen availability only if the truck should go back into the market.",
      owner: "Admin / Ops",
    };
  }

  if (booking.status === "REQUESTED" && booking.verificationStatus === "PENDING") {
    return {
      tone: "warning",
      title: "Waiting on verification before approval",
      detail: "The booking is still requested, and verification has not cleared yet. Approval should stay behind that checkpoint.",
      nextAction: "Clear or reject verification first, then return here for the booking decision.",
      owner: "Admin",
    };
  }

  if (booking.status === "REQUESTED") {
    return {
      tone: "warning",
      title: "Ready for a booking decision",
      detail: "The booking is still in the request lane and can now move forward or be closed with context.",
      nextAction: "Approve to move the workflow into payment capture, or reject with a clear note for the timeline.",
      owner: "Ops / Admin",
    };
  }

  if (booking.status === "APPROVED" && booking.paymentStatus === "PENDING_CAPTURE") {
    return {
      tone: "warning",
      title: "Approved, payment is the next gate",
      detail: "Approval is done, but the rental is not handoff-ready until payment is captured and the follow-up updates are sent.",
      nextAction:
        booking.customerNotificationState === "PENDING"
          ? "Send the payment instructions, then capture payment with a real reference as soon as it lands."
          : "Capture payment with the real reference, then make sure ops has the handoff-ready update queued.",
      owner: "Ops",
    };
  }

  if (booking.paymentStatus === "CAPTURED" || booking.status === "PAID") {
    return {
      tone: "success",
      title: "Paid and ready for handoff planning",
      detail: "Payment is captured, so the booking can move out of queue work and into pickup, keys, and return coordination.",
      nextAction:
        booking.opsNotificationState === "PENDING"
          ? "Send the handoff-ready ops update, then lock in pickup and return instructions."
          : "Use the detail page to keep pickup timing, keys, and return steps aligned across the team.",
      owner: "Ops",
    };
  }

  return {
    tone: "neutral",
    title: "Workflow update pending",
    detail: "This booking is in motion, but the next owner should confirm the latest status and notifications before acting.",
    nextAction: "Use the detail page as the source of truth before messaging the customer or changing status again.",
    owner: "Ops / Admin",
  };
}

export function getCustomerNotificationPreview(booking: BookingWorkflowSnapshot): NotificationPreview {
  const kind = getCustomerNotificationKind(booking.status, booking.verificationStatus, booking.customerNotificationKind);

  switch (kind) {
    case "REQUEST_RECEIVED":
      return {
        kind,
        audience: booking.customerEmail,
        title: "Booking request confirmation",
        body: `Hi ${booking.customerName}, we received your request for ${booking.listingTitle}. The team is reviewing your rental window and will follow up with the next step shortly.`,
        state: booking.customerNotificationState,
        sentAt: booking.customerNotificationSentAt,
      };
    case "BOOKING_APPROVED":
      return {
        kind,
        audience: booking.customerEmail,
        title: "Booking approved, payment next",
        body: `Good news, ${booking.customerName}. Your request for ${booking.listingTitle} is approved. The next step is payment so the rental can move into handoff preparation.`,
        state: booking.customerNotificationState,
        sentAt: booking.customerNotificationSentAt,
      };
    case "BOOKING_REJECTED":
      return {
        kind,
        audience: booking.customerEmail,
        title: "Booking update",
        body: `Hi ${booking.customerName}, we were not able to approve this booking for ${booking.listingTitle}. We can help you review another option if you still need a truck.`,
        state: booking.customerNotificationState,
        sentAt: booking.customerNotificationSentAt,
      };
    case "PAYMENT_CONFIRMED":
      return {
        kind,
        audience: booking.customerEmail,
        title: "Payment confirmed",
        body: `Your payment for ${booking.listingTitle} is confirmed. We will follow up with pickup and handoff details before the rental starts.`,
        state: booking.customerNotificationState,
        sentAt: booking.customerNotificationSentAt,
      };
    case "VERIFICATION_REJECTED":
      return {
        kind,
        audience: booking.customerEmail,
        title: "Verification update",
        body: `Hi ${booking.customerName}, we could not complete verification for ${booking.listingTitle}. Please reply with updated documents or contact support so we can help.`,
        state: booking.customerNotificationState,
        sentAt: booking.customerNotificationSentAt,
      };
    default:
      return {
        kind,
        audience: booking.customerEmail,
        title: "Booking workflow update",
        body: `Your booking for ${booking.listingTitle} has a new workflow update. The team will share the next step soon.`,
        state: booking.customerNotificationState,
        sentAt: booking.customerNotificationSentAt,
      };
  }
}

export function getOpsNotificationPreview(booking: BookingWorkflowSnapshot): NotificationPreview {
  const kind = getOpsNotificationKind(booking.status, booking.verificationStatus, booking.opsNotificationKind);

  switch (kind) {
    case "REQUEST_REVIEW":
      return {
        kind,
        audience: "ops@trucksnow.com",
        title: "Operator response needed",
        body: `A new booking request for ${booking.listingTitle} is waiting on operator review.`,
        state: booking.opsNotificationState,
        sentAt: booking.opsNotificationSentAt,
      };
    case "VERIFICATION_REVIEW":
      return {
        kind,
        audience: "ops@trucksnow.com",
        title: "Verification review needed",
        body: `${booking.customerName} is still waiting on verification review for ${booking.listingTitle}. Keep this in front of the rental window.`,
        state: booking.opsNotificationState,
        sentAt: booking.opsNotificationSentAt,
      };
    case "OPERATOR_REVIEW_READY":
      return {
        kind,
        audience: "ops@trucksnow.com",
        title: "Verification cleared",
        body: `${booking.customerName} is verified for ${booking.listingTitle}. The operator can move the booking through review and payment.`,
        state: booking.opsNotificationState,
        sentAt: booking.opsNotificationSentAt,
      };
    case "PAYMENT_FOLLOW_UP":
      return {
        kind,
        audience: "ops@trucksnow.com",
        title: "Payment follow-up",
        body: `${booking.customerName} has an approved booking for ${booking.listingTitle}. Watch for payment and handoff readiness.`,
        state: booking.opsNotificationState,
        sentAt: booking.opsNotificationSentAt,
      };
    case "HANDOFF_READY":
      return {
        kind,
        audience: "ops@trucksnow.com",
        title: "Handoff ready",
        body: `Payment is captured for ${booking.listingTitle}. Prep pickup timing, keys, and return instructions for ${booking.customerName}.`,
        state: booking.opsNotificationState,
        sentAt: booking.opsNotificationSentAt,
      };
    case "BOOKING_REJECTED":
      return {
        kind,
        audience: "ops@trucksnow.com",
        title: "Booking closed",
        body: `${booking.customerName}'s booking for ${booking.listingTitle} was rejected. Update the queue and reopen availability if needed.`,
        state: booking.opsNotificationState,
        sentAt: booking.opsNotificationSentAt,
      };
    case "VERIFICATION_REJECTED":
      return {
        kind,
        audience: "ops@trucksnow.com",
        title: "Verification blocked",
        body: `Verification failed for ${booking.customerName} on ${booking.listingTitle}. Keep the booking out of payment and handoff until resolved.`,
        state: booking.opsNotificationState,
        sentAt: booking.opsNotificationSentAt,
      };
    default:
      return {
        kind,
        audience: "ops@trucksnow.com",
        title: "Workflow update",
        body: `${booking.listingTitle} has a booking workflow update that may need operations visibility.`,
        state: booking.opsNotificationState,
        sentAt: booking.opsNotificationSentAt,
      };
  }
}
