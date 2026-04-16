"use client";

import { useMemo, useState } from "react";

import { createBookingRequest } from "@/app/actions";
import { formatCurrency, getRentalDays } from "@/src/lib/booking-workflow";

type BookingRequestFormProps = {
  listingId: string;
  dailyRate: number;
  defaultName?: string;
  defaultEmail?: string;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingRequestForm({ listingId, dailyRate, defaultName = "", defaultEmail = "" }: BookingRequestFormProps) {
  const [customerName, setCustomerName] = useState(defaultName);
  const [customerEmail, setCustomerEmail] = useState(defaultEmail);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const rentalDays = useMemo(() => getRentalDays(startDate, endDate), [startDate, endDate]);
  const estimatedTotal = rentalDays > 0 ? rentalDays * dailyRate : 0;
  const hasDates = startDate.length > 0 && endDate.length > 0;
  const hasInvalidDates = hasDates && rentalDays === 0;
  const today = getToday();

  return (
    <form action={createBookingRequest} className="mt-4 space-y-4">
      <input type="hidden" name="listingId" value={listingId} />

      <div>
        <label htmlFor="customerName" className="text-sm text-slate-300">
          Name
        </label>
        <input
          id="customerName"
          name="customerName"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="customerEmail" className="text-sm text-slate-300">
          Email
        </label>
        <input
          id="customerEmail"
          name="customerEmail"
          type="email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
          placeholder="you@example.com"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="text-sm text-slate-300">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            min={today}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="text-sm text-slate-300">
            End date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
        <p className="font-medium text-slate-100">Booking summary</p>
        <p className="mt-2">Daily rate: {formatCurrency(dailyRate)}</p>
        <p className="mt-1">Rental days: {rentalDays > 0 ? rentalDays : "Choose valid dates"}</p>
        <p className="mt-1">Estimated total: {estimatedTotal > 0 ? formatCurrency(estimatedTotal) : "Waiting on dates"}</p>
      </div>

      {hasInvalidDates ? (
        <p className="text-sm text-rose-300">End date must be after the start date.</p>
      ) : null}

      <button
        type="submit"
        disabled={hasInvalidDates}
        className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-500/40"
      >
        Send booking request
      </button>
    </form>
  );
}
