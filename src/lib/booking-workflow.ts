export type BookingWorkflowSnapshot = {
  listingTitle: string;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
  verificationStatus: string;
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

export function getPaymentSummary(booking: BookingWorkflowSnapshot) {
  const rentalDays = getRentalDays(booking.startDate, booking.endDate);
  const platformFee = Math.round(booking.totalAmount * 0.1);
  const operatorPayout = booking.totalAmount - platformFee;

  if (booking.status === "PAID") {
    return {
      rentalDays,
      platformFee,
      operatorPayout,
      label: "Payment captured",
      note: "Payment is already marked as captured. The operator can now focus on handoff and fulfillment.",
    };
  }

  if (booking.status === "APPROVED") {
    return {
      rentalDays,
      platformFee,
      operatorPayout,
      label: "Payment ready",
      note: "The booking is approved and ready for payment capture before the rental starts.",
    };
  }

  return {
    rentalDays,
    platformFee,
    operatorPayout,
    label: "Payment waiting on workflow",
    note: "The booking still needs workflow movement before payment should be collected.",
  };
}

export function getCustomerNotificationPreview(booking: BookingWorkflowSnapshot) {
  if (booking.status === "REQUESTED") {
    return {
      audience: booking.customerEmail,
      title: "Booking request confirmation",
      body: `Hi ${booking.customerName}, we received your request for ${booking.listingTitle}. The team is reviewing your rental window and will follow up with the next step shortly.`,
    };
  }

  if (booking.status === "APPROVED") {
    return {
      audience: booking.customerEmail,
      title: "Booking approved, payment next",
      body: `Good news, ${booking.customerName}. Your request for ${booking.listingTitle} is approved. The next step is payment so the rental can move into handoff preparation.`,
    };
  }

  if (booking.status === "REJECTED") {
    return {
      audience: booking.customerEmail,
      title: "Booking update",
      body: `Hi ${booking.customerName}, we were not able to approve this booking for ${booking.listingTitle}. We can help you review another option if you still need a truck.`,
    };
  }

  if (booking.status === "PAID") {
    return {
      audience: booking.customerEmail,
      title: "Payment confirmed",
      body: `Your payment for ${booking.listingTitle} is confirmed. We will follow up with pickup and handoff details before the rental starts.`,
    };
  }

  return {
    audience: booking.customerEmail,
    title: "Booking workflow update",
    body: `Your booking for ${booking.listingTitle} has a new workflow update. The team will share the next step soon.`,
  };
}

export function getOpsNotificationPreview(booking: BookingWorkflowSnapshot) {
  if (booking.verificationStatus === "PENDING") {
    return {
      audience: "ops@trucksnow.com",
      title: "Verification review needed",
      body: `${booking.customerName} is still waiting on verification review for ${booking.listingTitle}. Keep this in front of the rental window.`,
    };
  }

  if (booking.status === "REQUESTED") {
    return {
      audience: "ops@trucksnow.com",
      title: "Operator response needed",
      body: `A new booking request for ${booking.listingTitle} is waiting on operator review.`,
    };
  }

  if (booking.status === "APPROVED") {
    return {
      audience: "ops@trucksnow.com",
      title: "Payment follow-up",
      body: `${booking.customerName} has an approved booking for ${booking.listingTitle}. Watch for payment and handoff readiness.`,
    };
  }

  return {
    audience: "ops@trucksnow.com",
    title: "Workflow update",
    body: `${booking.listingTitle} has a booking workflow update that may need operations visibility.`,
  };
}
