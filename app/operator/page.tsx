import Link from "next/link";

import { requireRole } from "@/src/lib/auth";
import { getOperatorDashboardData } from "@/src/lib/inventory";

type OperatorFilters = {
  listingFilter?: string;
  bookingFilter?: string;
  listingSearch?: string;
  bookingSearch?: string;
  listingSort?: string;
  bookingSort?: string;
  listingAge?: string;
  bookingAge?: string;
  bookingWindow?: string;
  bookingPayment?: string;
  listingStatuses?: string | string[];
  bookingStatuses?: string | string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
    case "PAID":
    case "APPROVED":
      return "bg-emerald-500/15 text-emerald-300";
    case "PENDING_APPROVAL":
    case "REQUESTED":
      return "bg-amber-500/15 text-amber-300";
    case "DRAFT":
    case "ARCHIVED":
      return "bg-slate-700 text-slate-300";
    default:
      return "bg-rose-500/15 text-rose-300";
  }
}

function getTimestamp(value?: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function getAgeDays(value?: string | null) {
  if (!value) {
    return null;
  }

  const diffMs = Date.now() - new Date(value).getTime();

  if (Number.isNaN(diffMs) || diffMs < 0) {
    return null;
  }

  return Math.floor(diffMs / DAY_MS);
}

function getLocalDayKey(value: string) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

function parseSelectedStatuses(value?: string | string[] | null) {
  if (!value) {
    return [] as string[];
  }

  const raw = Array.isArray(value) ? value : [value];

  return [...new Set(raw.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean))];
}

function getAgeMeta(value?: string | null, staleAfterDays = 3) {
  const diffDays = getAgeDays(value);

  if (diffDays === null) {
    return null;
  }
  const label = diffDays === 0 ? "new today" : diffDays === 1 ? "1d old" : `${diffDays}d old`;

  if (diffDays >= staleAfterDays) {
    return {
      label: `stale · ${label}`,
      className: "bg-rose-500/15 text-rose-300",
    };
  }

  if (diffDays >= Math.max(1, staleAfterDays - 1)) {
    return {
      label,
      className: "bg-amber-500/15 text-amber-300",
    };
  }

  return {
    label,
    className: "bg-slate-700 text-slate-300",
  };
}

function buildOperatorHref(current: OperatorFilters, updates: Partial<Record<keyof OperatorFilters, string | null>>) {
  const next = { ...current, ...updates };
  const params = new URLSearchParams();

  const listingFilter = next.listingFilter ?? "all";
  const bookingFilter = next.bookingFilter ?? "all";
  const listingSort = next.listingSort ?? "newest";
  const bookingSort = next.bookingSort ?? "age";
  const listingAge = next.listingAge ?? "all";
  const bookingAge = next.bookingAge ?? "all";
  const bookingWindow = next.bookingWindow ?? "all";
  const bookingPayment = next.bookingPayment ?? "all";
  const listingSearch = next.listingSearch?.trim() ?? "";
  const bookingSearch = next.bookingSearch?.trim() ?? "";
  const listingStatuses = parseSelectedStatuses(next.listingStatuses);
  const bookingStatuses = parseSelectedStatuses(next.bookingStatuses);

  if (listingFilter !== "all") {
    params.set("listingFilter", listingFilter);
  }

  if (bookingFilter !== "all") {
    params.set("bookingFilter", bookingFilter);
  }

  if (listingSearch) {
    params.set("listingSearch", listingSearch);
  }

  if (bookingSearch) {
    params.set("bookingSearch", bookingSearch);
  }

  if (listingStatuses.length > 0) {
    params.set("listingStatuses", listingStatuses.join(","));
  }

  if (bookingStatuses.length > 0) {
    params.set("bookingStatuses", bookingStatuses.join(","));
  }

  if (listingAge !== "all") {
    params.set("listingAge", listingAge);
  }

  if (bookingAge !== "all") {
    params.set("bookingAge", bookingAge);
  }

  if (bookingWindow !== "all") {
    params.set("bookingWindow", bookingWindow);
  }

  if (bookingPayment !== "all") {
    params.set("bookingPayment", bookingPayment);
  }

  if (listingSort !== "newest") {
    params.set("listingSort", listingSort);
  }

  if (bookingSort !== "age") {
    params.set("bookingSort", bookingSort);
  }

  const query = params.toString();
  return query ? `/operator?${query}` : "/operator";
}

export default async function OperatorPage({
  searchParams,
}: {
  searchParams: Promise<OperatorFilters>;
}) {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator");
  const filters = await searchParams;
  const data = await getOperatorDashboardData(session.role === "OPERATOR" ? session.email : undefined);

  const listingFilter = filters.listingFilter ?? "all";
  const bookingFilter = filters.bookingFilter ?? "all";
  const listingSearch = filters.listingSearch?.trim().toLowerCase() ?? "";
  const bookingSearch = filters.bookingSearch?.trim().toLowerCase() ?? "";
  const listingSort = filters.listingSort ?? "newest";
  const bookingSort = filters.bookingSort ?? "age";
  const listingAge = filters.listingAge ?? "all";
  const bookingAge = filters.bookingAge ?? "all";
  const bookingWindow = filters.bookingWindow ?? "all";
  const bookingPayment = filters.bookingPayment ?? "all";
  const todayKey = getLocalDayKey(new Date().toISOString());
  const listingStatuses = new Set(parseSelectedStatuses(filters.listingStatuses));
  const bookingStatuses = new Set(parseSelectedStatuses(filters.bookingStatuses));

  const filteredListings = data.listings.filter((listing) => {
    const matchesSearch =
      listingSearch.length === 0 ||
      [listing.title, listing.city, listing.state, listing.status, listing.vehicleType].some((value) =>
        value.toLowerCase().includes(listingSearch),
      );

    if (!matchesSearch) {
      return false;
    }

    if (listingAge === "48h") {
      const ageDays = getAgeDays(listing.createdAt);
      if (ageDays === null || ageDays < 2) {
        return false;
      }
    }

    if (listingStatuses.size > 0 && !listingStatuses.has(listing.status)) {
      return false;
    }

    switch (listingFilter) {
      case "active":
        return listing.status === "ACTIVE";
      case "approval":
        return listing.status === "PENDING_APPROVAL";
      case "draft":
        return listing.status === "DRAFT";
      case "rejected":
        return listing.status === "REJECTED";
      case "archived":
        return listing.status === "ARCHIVED";
      default:
        return true;
    }
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (listingSort) {
      case "age":
        return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
      case "rate-high":
        return b.dailyRate - a.dailyRate;
      case "status":
        return a.status.localeCompare(b.status) || a.title.localeCompare(b.title);
      default:
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    }
  });

  const filteredBookings = data.bookings.filter((booking) => {
    const matchesSearch =
      bookingSearch.length === 0 ||
      [booking.listingTitle, booking.customerName, booking.city, booking.status, booking.verificationStatus].some((value) =>
        value.toLowerCase().includes(bookingSearch),
      );

    if (!matchesSearch) {
      return false;
    }

    if (bookingAge === "48h") {
      const ageDays = getAgeDays(booking.createdAt);
      if (ageDays === null || ageDays < 2) {
        return false;
      }
    }

    if (bookingWindow === "today" && getLocalDayKey(booking.startDate) !== todayKey) {
      return false;
    }

    if (bookingPayment === "chase" && booking.paymentStatus === "CAPTURED") {
      return false;
    }

    if (bookingStatuses.size > 0 && !bookingStatuses.has(booking.status)) {
      return false;
    }

    switch (bookingFilter) {
      case "attention":
        return (
          booking.status === "REQUESTED" ||
          booking.status === "REJECTED" ||
          booking.verificationStatus === "PENDING" ||
          booking.verificationStatus === "REJECTED"
        );
      case "requested":
        return booking.status === "REQUESTED";
      case "approved":
        return booking.status === "APPROVED";
      case "paid":
        return booking.status === "PAID";
      case "rejected":
        return booking.status === "REJECTED";
      default:
        return true;
    }
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    switch (bookingSort) {
      case "newest":
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      case "amount-high":
        return b.totalAmount - a.totalAmount;
      case "start-soon":
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      default:
        return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
    }
  });

  const listingFilters = [
    { key: "all", label: "All", count: data.listings.length },
    { key: "active", label: "Active", count: data.listings.filter((listing) => listing.status === "ACTIVE").length },
    {
      key: "approval",
      label: "Pending approval",
      count: data.listings.filter((listing) => listing.status === "PENDING_APPROVAL").length,
    },
    { key: "draft", label: "Drafts", count: data.listings.filter((listing) => listing.status === "DRAFT").length },
    { key: "rejected", label: "Rejected", count: data.listings.filter((listing) => listing.status === "REJECTED").length },
  ];

  const bookingFilters = [
    { key: "all", label: "All", count: data.bookings.length },
    {
      key: "attention",
      label: "Needs attention",
      count: data.bookings.filter(
        (booking) =>
          booking.status === "REQUESTED" ||
          booking.status === "REJECTED" ||
          booking.verificationStatus === "PENDING" ||
          booking.verificationStatus === "REJECTED",
      ).length,
    },
    { key: "requested", label: "Requested", count: data.bookings.filter((booking) => booking.status === "REQUESTED").length },
    { key: "approved", label: "Approved", count: data.bookings.filter((booking) => booking.status === "APPROVED").length },
    { key: "paid", label: "Paid", count: data.bookings.filter((booking) => booking.status === "PAID").length },
  ];

  const listingSortOptions = [
    { key: "newest", label: "Newest" },
    { key: "age", label: "Oldest first" },
    { key: "rate-high", label: "Highest rate" },
    { key: "status", label: "Status" },
  ];

  const bookingSortOptions = [
    { key: "age", label: "Oldest first" },
    { key: "newest", label: "Newest" },
    { key: "start-soon", label: "Trip soonest" },
    { key: "amount-high", label: "Highest amount" },
  ];

  const listingStatusOptions = ["ACTIVE", "PENDING_APPROVAL", "DRAFT", "REJECTED", "ARCHIVED"];
  const bookingStatusOptions = ["REQUESTED", "APPROVED", "PAID", "REJECTED"];

  const presets = [
    {
      label: "Needs attention",
      href: buildOperatorHref(filters, {
        listingFilter: "approval",
        bookingFilter: "attention",
        listingSort: "age",
        bookingSort: "age",
        listingSearch: "",
        bookingSearch: "",
      }),
    },
    {
      label: "Today only",
      href: buildOperatorHref(filters, {
        bookingWindow: "today",
        bookingSort: "start-soon",
        bookingSearch: "",
      }),
    },
    {
      label: "48h stale",
      href: buildOperatorHref(filters, {
        listingAge: "48h",
        bookingAge: "48h",
        listingSort: "age",
        bookingSort: "age",
        listingSearch: "",
        bookingSearch: "",
      }),
    },
    {
      label: "Rejected cleanup",
      href: buildOperatorHref(filters, {
        listingFilter: "rejected",
        bookingFilter: "rejected",
        listingSort: "age",
        bookingSort: "age",
        listingSearch: "",
        bookingSearch: "",
      }),
    },
    {
      label: "Money in flight",
      href: buildOperatorHref(filters, {
        listingFilter: "active",
        bookingFilter: "approved",
        listingSort: "rate-high",
        bookingSort: "amount-high",
        listingSearch: "",
        bookingSearch: "",
      }),
    },
    {
      label: "Payment chase",
      href: buildOperatorHref(filters, {
        bookingPayment: "chase",
        bookingFilter: "all",
        bookingSort: "amount-high",
        bookingSearch: "",
      }),
    },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16 text-white">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
          <h1 className="mt-4 text-4xl font-bold">Operator portal</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Manage live trucks, watch booking requests, and move into item-level workflow pages when something needs
            attention.
          </p>
        </div>
        <Link
          href="/operator/listings/new"
          className="inline-flex rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
        >
          Add listing
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <a href="#operator-listings" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Jump to listings
        </a>
        <a href="#operator-bookings" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Jump to bookings
        </a>
      </div>

      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <span className="self-center text-slate-400">Queue presets</span>
        <Link href="/operator" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Reset
        </Link>
        {presets.map((preset) => (
          <Link
            key={preset.label}
            href={preset.href}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-orange-400 hover:text-orange-200"
          >
            {preset.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Active listings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.activeListings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Draft + pending</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.pendingListings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Requested bookings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.requestedBookings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Paid bookings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.paidBookings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Daily revenue potential</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(data.stats.revenuePotential)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section id="operator-listings" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">Listings</h2>
              <span className="text-sm text-slate-400">{sortedListings.length} shown</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {listingFilters.map((filter) => {
                const isActive = listingFilter === filter.key;
                return (
                  <Link
                    key={filter.key}
                    href={buildOperatorHref(filters, { listingFilter: filter.key })}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      isActive
                        ? "border-orange-400 bg-orange-500/15 text-orange-200"
                        : "border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {filter.label} · {filter.count}
                  </Link>
                );
              })}
            </div>

            <form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {listingFilter !== "all" ? <input type="hidden" name="listingFilter" value={listingFilter} /> : null}
                {bookingFilter !== "all" ? <input type="hidden" name="bookingFilter" value={bookingFilter} /> : null}
                {bookingSearch ? <input type="hidden" name="bookingSearch" value={filters.bookingSearch ?? ""} /> : null}
                {bookingSort !== "age" ? <input type="hidden" name="bookingSort" value={bookingSort} /> : null}
                {listingAge !== "all" ? <input type="hidden" name="listingAge" value={listingAge} /> : null}
                {bookingAge !== "all" ? <input type="hidden" name="bookingAge" value={bookingAge} /> : null}
                {bookingWindow !== "all" ? <input type="hidden" name="bookingWindow" value={bookingWindow} /> : null}
                {bookingPayment !== "all" ? <input type="hidden" name="bookingPayment" value={bookingPayment} /> : null}
                {listingStatuses.size > 0 ? (
                  <input type="hidden" name="listingStatuses" value={[...listingStatuses].join(",")} />
                ) : null}
                {bookingStatuses.size > 0 ? (
                  <input type="hidden" name="bookingStatuses" value={[...bookingStatuses].join(",")} />
                ) : null}
                <input
                  type="search"
                  name="listingSearch"
                  defaultValue={filters.listingSearch ?? ""}
                  placeholder="Search listings"
                  className="w-full min-w-[220px] rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-orange-400 lg:max-w-xs"
                />
                <select
                  name="listingSort"
                  defaultValue={listingSort}
                  className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-orange-400"
                >
                  {listingSortOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      Sort: {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                >
                  Apply
                </button>
              </div>
            </form>

            <form method="get" className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              {listingFilter !== "all" ? <input type="hidden" name="listingFilter" value={listingFilter} /> : null}
              {bookingFilter !== "all" ? <input type="hidden" name="bookingFilter" value={bookingFilter} /> : null}
              {filters.listingSearch ? <input type="hidden" name="listingSearch" value={filters.listingSearch} /> : null}
              {filters.bookingSearch ? <input type="hidden" name="bookingSearch" value={filters.bookingSearch} /> : null}
              {listingSort !== "newest" ? <input type="hidden" name="listingSort" value={listingSort} /> : null}
              {bookingSort !== "age" ? <input type="hidden" name="bookingSort" value={bookingSort} /> : null}
              {listingAge !== "all" ? <input type="hidden" name="listingAge" value={listingAge} /> : null}
              {bookingAge !== "all" ? <input type="hidden" name="bookingAge" value={bookingAge} /> : null}
              {bookingWindow !== "all" ? <input type="hidden" name="bookingWindow" value={bookingWindow} /> : null}
              {bookingPayment !== "all" ? <input type="hidden" name="bookingPayment" value={bookingPayment} /> : null}
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Editable status filter</p>
              <div className="flex flex-wrap gap-3">
                {listingStatusOptions.map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      name="listingStatuses"
                      value={status}
                      defaultChecked={listingStatuses.has(status)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-orange-500 focus:ring-orange-400"
                    />
                    {status.replaceAll("_", " ")}
                  </label>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button type="submit" className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500">
                  Apply statuses
                </button>
                <Link href={buildOperatorHref(filters, { listingStatuses: null })} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500">
                  Clear
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-4 space-y-3">
            {sortedListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-300">
                No listings match this view yet.
              </div>
            ) : (
              sortedListings.map((listing) => {
                const ageMeta = getAgeMeta(listing.createdAt, listing.status === "ACTIVE" ? 14 : 5);

                return (
                  <div key={listing.id} className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{listing.title}</h3>
                          {ageMeta ? (
                            <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${ageMeta.className}`}>
                              {ageMeta.label}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {listing.city}, {listing.state}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(listing.status)}`}>
                          {listing.status.replaceAll("_", " ")}
                        </span>
                        <span className="text-sm font-medium text-slate-200">{formatCurrency(listing.dailyRate)}/day</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/operator/listings/${listing.id}`}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                      >
                        Open workflow
                      </Link>
                      <Link
                        href={`/customer/listings/${listing.id}`}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                      >
                        Open customer view
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section id="operator-bookings" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">Recent bookings</h2>
              <span className="text-sm text-slate-400">{sortedBookings.length} shown</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {bookingFilters.map((filter) => {
                const isActive = bookingFilter === filter.key;
                return (
                  <Link
                    key={filter.key}
                    href={buildOperatorHref(filters, { bookingFilter: filter.key })}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      isActive
                        ? "border-orange-400 bg-orange-500/15 text-orange-200"
                        : "border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {filter.label} · {filter.count}
                  </Link>
                );
              })}
            </div>

            <form method="get" className="flex flex-col gap-3">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {listingFilter !== "all" ? <input type="hidden" name="listingFilter" value={listingFilter} /> : null}
                {listingSearch ? <input type="hidden" name="listingSearch" value={filters.listingSearch ?? ""} /> : null}
                {listingSort !== "newest" ? <input type="hidden" name="listingSort" value={listingSort} /> : null}
                {listingAge !== "all" ? <input type="hidden" name="listingAge" value={listingAge} /> : null}
                {bookingAge !== "all" ? <input type="hidden" name="bookingAge" value={bookingAge} /> : null}
                {bookingWindow !== "all" ? <input type="hidden" name="bookingWindow" value={bookingWindow} /> : null}
                {bookingPayment !== "all" ? <input type="hidden" name="bookingPayment" value={bookingPayment} /> : null}
                {listingStatuses.size > 0 ? (
                  <input type="hidden" name="listingStatuses" value={[...listingStatuses].join(",")} />
                ) : null}
                {bookingStatuses.size > 0 ? (
                  <input type="hidden" name="bookingStatuses" value={[...bookingStatuses].join(",")} />
                ) : null}
                {bookingFilter !== "all" ? <input type="hidden" name="bookingFilter" value={bookingFilter} /> : null}
                <input
                  type="search"
                  name="bookingSearch"
                  defaultValue={filters.bookingSearch ?? ""}
                  placeholder="Search bookings"
                  className="w-full min-w-[220px] rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-orange-400 lg:max-w-xs"
                />
                <select
                  name="bookingSort"
                  defaultValue={bookingSort}
                  className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-orange-400"
                >
                  {bookingSortOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      Sort: {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                >
                  Apply
                </button>
              </div>
            </form>

            <form method="get" className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              {listingFilter !== "all" ? <input type="hidden" name="listingFilter" value={listingFilter} /> : null}
              {bookingFilter !== "all" ? <input type="hidden" name="bookingFilter" value={bookingFilter} /> : null}
              {filters.listingSearch ? <input type="hidden" name="listingSearch" value={filters.listingSearch} /> : null}
              {filters.bookingSearch ? <input type="hidden" name="bookingSearch" value={filters.bookingSearch} /> : null}
              {listingSort !== "newest" ? <input type="hidden" name="listingSort" value={listingSort} /> : null}
              {bookingSort !== "age" ? <input type="hidden" name="bookingSort" value={bookingSort} /> : null}
              {listingAge !== "all" ? <input type="hidden" name="listingAge" value={listingAge} /> : null}
              {bookingAge !== "all" ? <input type="hidden" name="bookingAge" value={bookingAge} /> : null}
              {bookingWindow !== "all" ? <input type="hidden" name="bookingWindow" value={bookingWindow} /> : null}
              {bookingPayment !== "all" ? <input type="hidden" name="bookingPayment" value={bookingPayment} /> : null}
              {listingStatuses.size > 0 ? <input type="hidden" name="listingStatuses" value={[...listingStatuses].join(",")} /> : null}
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Editable status filter</p>
              <div className="flex flex-wrap gap-3">
                {bookingStatusOptions.map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      name="bookingStatuses"
                      value={status}
                      defaultChecked={bookingStatuses.has(status)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-orange-500 focus:ring-orange-400"
                    />
                    {status.replaceAll("_", " ")}
                  </label>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button type="submit" className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500">
                  Apply statuses
                </button>
                <Link href={buildOperatorHref(filters, { bookingStatuses: null })} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500">
                  Clear
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-4 space-y-3">
            {sortedBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-300">
                No bookings match this view right now.
              </div>
            ) : (
              sortedBookings.map((booking) => {
                const ageMeta = getAgeMeta(booking.createdAt, booking.status === "APPROVED" ? 2 : 3);

                return (
                  <div key={booking.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{booking.listingTitle}</h3>
                        {ageMeta ? (
                          <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${ageMeta.className}`}>
                            {ageMeta.label}
                          </span>
                        ) : null}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(booking.status)}`}>
                        {booking.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {booking.customerName} in {booking.city}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDate(booking.startDate)} to {formatDate(booking.endDate)}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        Verification: <span className="text-slate-200">{booking.verificationStatus.replaceAll("_", " ")}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-700 px-3 py-1 text-[11px] font-medium text-slate-200">
                          {booking.paymentStatus.replaceAll("_", " ")}
                        </span>
                        <span className="font-medium text-slate-200">{formatCurrency(booking.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/operator/bookings/${booking.id}`}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                      >
                        Review booking
                      </Link>
                      <Link
                        href={`/operator/listings/${booking.listingId}`}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                      >
                        Open listing
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
