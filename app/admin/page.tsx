import Link from "next/link";

import { requireRole } from "@/src/lib/auth";
import { getAdminDashboardData } from "@/src/lib/inventory";

type AdminFilters = {
  listingFilter?: string;
  bookingFilter?: string;
  verificationFilter?: string;
  listingSearch?: string;
  bookingSearch?: string;
  verificationSearch?: string;
  listingSort?: string;
  bookingSort?: string;
  verificationSort?: string;
  listingAge?: string;
  bookingAge?: string;
  verificationAge?: string;
  bookingWindow?: string;
  bookingPayment?: string;
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
    case "APPROVED":
      return "bg-emerald-500/15 text-emerald-300";
    case "PENDING_APPROVAL":
    case "REQUESTED":
    case "PENDING":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-slate-700 text-slate-300";
  }
}

function itemLabel(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
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

function buildAdminHref(current: AdminFilters, updates: Partial<Record<keyof AdminFilters, string | null>>) {
  const next = { ...current, ...updates };
  const params = new URLSearchParams();

  const listingFilter = next.listingFilter ?? "all";
  const bookingFilter = next.bookingFilter ?? "requested";
  const verificationFilter = next.verificationFilter ?? "pending";
  const listingSort = next.listingSort ?? "age";
  const bookingSort = next.bookingSort ?? "age";
  const verificationSort = next.verificationSort ?? "age";
  const listingAge = next.listingAge ?? "all";
  const bookingAge = next.bookingAge ?? "all";
  const verificationAge = next.verificationAge ?? "all";
  const bookingWindow = next.bookingWindow ?? "all";
  const bookingPayment = next.bookingPayment ?? "all";
  const listingSearch = next.listingSearch?.trim() ?? "";
  const bookingSearch = next.bookingSearch?.trim() ?? "";
  const verificationSearch = next.verificationSearch?.trim() ?? "";

  if (listingFilter !== "all") {
    params.set("listingFilter", listingFilter);
  }

  if (bookingFilter !== "requested") {
    params.set("bookingFilter", bookingFilter);
  }

  if (verificationFilter !== "pending") {
    params.set("verificationFilter", verificationFilter);
  }

  if (listingSearch) {
    params.set("listingSearch", listingSearch);
  }

  if (bookingSearch) {
    params.set("bookingSearch", bookingSearch);
  }

  if (verificationSearch) {
    params.set("verificationSearch", verificationSearch);
  }

  if (listingAge !== "all") {
    params.set("listingAge", listingAge);
  }

  if (bookingAge !== "all") {
    params.set("bookingAge", bookingAge);
  }

  if (verificationAge !== "all") {
    params.set("verificationAge", verificationAge);
  }

  if (bookingWindow !== "all") {
    params.set("bookingWindow", bookingWindow);
  }

  if (bookingPayment !== "all") {
    params.set("bookingPayment", bookingPayment);
  }

  if (listingSort !== "age") {
    params.set("listingSort", listingSort);
  }

  if (bookingSort !== "age") {
    params.set("bookingSort", bookingSort);
  }

  if (verificationSort !== "age") {
    params.set("verificationSort", verificationSort);
  }

  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminFilters>;
}) {
  await requireRole(["ADMIN"], "/admin");
  const filters = await searchParams;
  const data = await getAdminDashboardData();

  const listingFilter = filters.listingFilter ?? "all";
  const bookingFilter = filters.bookingFilter ?? "requested";
  const verificationFilter = filters.verificationFilter ?? "pending";
  const listingSearch = filters.listingSearch?.trim().toLowerCase() ?? "";
  const bookingSearch = filters.bookingSearch?.trim().toLowerCase() ?? "";
  const verificationSearch = filters.verificationSearch?.trim().toLowerCase() ?? "";
  const listingSort = filters.listingSort ?? "age";
  const bookingSort = filters.bookingSort ?? "age";
  const verificationSort = filters.verificationSort ?? "age";
  const listingAge = filters.listingAge ?? "all";
  const bookingAge = filters.bookingAge ?? "all";
  const verificationAge = filters.verificationAge ?? "all";
  const bookingWindow = filters.bookingWindow ?? "all";
  const bookingPayment = filters.bookingPayment ?? "all";
  const todayKey = getLocalDayKey(new Date().toISOString());

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

    switch (listingFilter) {
      case "pending":
        return listing.status === "PENDING_APPROVAL";
      case "rejected":
        return listing.status === "REJECTED";
      case "active":
        return listing.status === "ACTIVE";
      default:
        return true;
    }
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (listingSort) {
      case "newest":
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      case "title":
        return a.title.localeCompare(b.title);
      case "status":
        return a.status.localeCompare(b.status) || a.title.localeCompare(b.title);
      default:
        return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
    }
  });

  const filteredBookings = data.bookings.filter((booking) => {
    const matchesSearch =
      bookingSearch.length === 0 ||
      [booking.listingTitle, booking.customerName, booking.status, booking.verificationStatus].some((value) =>
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

    switch (bookingFilter) {
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
      case "status":
        return a.status.localeCompare(b.status) || b.totalAmount - a.totalAmount;
      default:
        return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
    }
  });

  const filteredVerificationQueue = data.bookings.filter((booking) => {
    const matchesSearch =
      verificationSearch.length === 0 ||
      [booking.listingTitle, booking.customerName, booking.status, booking.verificationStatus].some((value) =>
        value.toLowerCase().includes(verificationSearch),
      );

    if (!matchesSearch) {
      return false;
    }

    if (verificationAge === "48h") {
      const ageDays = getAgeDays(booking.createdAt);
      if (ageDays === null || ageDays < 2) {
        return false;
      }
    }

    switch (verificationFilter) {
      case "pending":
        return booking.verificationStatus === "PENDING";
      case "approved":
        return booking.verificationStatus === "APPROVED";
      case "rejected":
        return booking.verificationStatus === "REJECTED";
      default:
        return true;
    }
  });

  const sortedVerificationQueue = [...filteredVerificationQueue].sort((a, b) => {
    switch (verificationSort) {
      case "newest":
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      case "amount-high":
        return b.totalAmount - a.totalAmount;
      case "customer":
        return a.customerName.localeCompare(b.customerName);
      default:
        return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
    }
  });

  const listingFilters = [
    { key: "all", label: "All", count: data.listings.length },
    {
      key: "pending",
      label: "Pending approval",
      count: data.listings.filter((listing) => listing.status === "PENDING_APPROVAL").length,
    },
    { key: "rejected", label: "Rejected", count: data.listings.filter((listing) => listing.status === "REJECTED").length },
    { key: "active", label: "Active", count: data.listings.filter((listing) => listing.status === "ACTIVE").length },
  ];

  const bookingFilters = [
    { key: "all", label: "All", count: data.bookings.length },
    { key: "requested", label: "Requested", count: data.bookings.filter((booking) => booking.status === "REQUESTED").length },
    { key: "approved", label: "Approved", count: data.bookings.filter((booking) => booking.status === "APPROVED").length },
    { key: "paid", label: "Paid", count: data.bookings.filter((booking) => booking.status === "PAID").length },
    { key: "rejected", label: "Rejected", count: data.bookings.filter((booking) => booking.status === "REJECTED").length },
  ];

  const verificationFilters = [
    { key: "all", label: "All", count: data.bookings.length },
    {
      key: "pending",
      label: "Pending",
      count: data.bookings.filter((booking) => booking.verificationStatus === "PENDING").length,
    },
    {
      key: "approved",
      label: "Approved",
      count: data.bookings.filter((booking) => booking.verificationStatus === "APPROVED").length,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: data.bookings.filter((booking) => booking.verificationStatus === "REJECTED").length,
    },
  ];

  const listingSortOptions = [
    { key: "age", label: "Oldest first" },
    { key: "newest", label: "Newest" },
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
  ];

  const bookingSortOptions = [
    { key: "age", label: "Oldest first" },
    { key: "newest", label: "Newest" },
    { key: "amount-high", label: "Highest amount" },
    { key: "status", label: "Status" },
  ];

  const verificationSortOptions = [
    { key: "age", label: "Oldest first" },
    { key: "newest", label: "Newest" },
    { key: "amount-high", label: "Highest amount" },
    { key: "customer", label: "Customer" },
  ];

  const presets = [
    {
      label: "Needs review",
      href: buildAdminHref(filters, {
        listingFilter: "pending",
        bookingFilter: "requested",
        verificationFilter: "pending",
        listingSearch: "",
        bookingSearch: "",
        verificationSearch: "",
        listingSort: "age",
        bookingSort: "age",
        verificationSort: "age",
      }),
    },
    {
      label: "Today only",
      href: buildAdminHref(filters, {
        bookingWindow: "today",
        bookingSort: "newest",
        bookingSearch: "",
      }),
    },
    {
      label: "48h stale",
      href: buildAdminHref(filters, {
        listingAge: "48h",
        bookingAge: "48h",
        verificationAge: "48h",
        listingSort: "age",
        bookingSort: "age",
        verificationSort: "age",
        listingSearch: "",
        bookingSearch: "",
        verificationSearch: "",
      }),
    },
    {
      label: "Rejected cleanup",
      href: buildAdminHref(filters, {
        listingFilter: "rejected",
        bookingFilter: "rejected",
        verificationFilter: "rejected",
        listingSearch: "",
        bookingSearch: "",
        verificationSearch: "",
        listingSort: "age",
        bookingSort: "age",
        verificationSort: "age",
      }),
    },
    {
      label: "High dollar first",
      href: buildAdminHref(filters, {
        bookingSort: "amount-high",
        verificationSort: "amount-high",
        bookingSearch: "",
        verificationSearch: "",
      }),
    },
    {
      label: "Money in flight",
      href: buildAdminHref(filters, {
        listingFilter: "active",
        bookingFilter: "approved",
        verificationFilter: "approved",
        listingSearch: "",
        bookingSearch: "",
        verificationSearch: "",
        listingSort: "newest",
        bookingSort: "amount-high",
        verificationSort: "amount-high",
      }),
    },
    {
      label: "Payment chase",
      href: buildAdminHref(filters, {
        bookingPayment: "chase",
        bookingFilter: "all",
        bookingSort: "amount-high",
        bookingSearch: "",
      }),
    },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16 text-white">
      <div className="mb-10">
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
        <h1 className="mt-4 text-4xl font-bold">Admin portal</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Review listings, booking requests, and verification work. Each queue item now opens into a dedicated review
          page so the team has a clear next step.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <a href="#admin-listing-review" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Listing review
        </a>
        <a href="#admin-booking-review" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Booking review
        </a>
        <a href="#admin-verification-queue" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Verification queue
        </a>
      </div>

      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <span className="self-center text-slate-400">Queue presets</span>
        <Link href="/admin" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Pending approvals</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.pendingApprovals}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Active listings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.activeListings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Requested bookings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.requestedBookings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Verification pending</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.verificationPending}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section id="admin-listing-review" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">Listing review</h2>
              <span className="text-sm text-slate-400">{itemLabel(sortedListings.length)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {listingFilters.map((filter) => {
                const isActive = listingFilter === filter.key;
                return (
                  <Link
                    key={filter.key}
                    href={buildAdminHref(filters, { listingFilter: filter.key })}
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

            <form method="get" className="flex flex-wrap items-center gap-2">
              {listingFilter !== "all" ? <input type="hidden" name="listingFilter" value={listingFilter} /> : null}
              {bookingFilter !== "requested" ? <input type="hidden" name="bookingFilter" value={bookingFilter} /> : null}
              {verificationFilter !== "pending" ? (
                <input type="hidden" name="verificationFilter" value={verificationFilter} />
              ) : null}
              {bookingSearch ? <input type="hidden" name="bookingSearch" value={filters.bookingSearch ?? ""} /> : null}
              {verificationSearch ? (
                <input type="hidden" name="verificationSearch" value={filters.verificationSearch ?? ""} />
              ) : null}
              {bookingSort !== "age" ? <input type="hidden" name="bookingSort" value={bookingSort} /> : null}
              {verificationSort !== "age" ? <input type="hidden" name="verificationSort" value={verificationSort} /> : null}
              {listingAge !== "all" ? <input type="hidden" name="listingAge" value={listingAge} /> : null}
              {bookingAge !== "all" ? <input type="hidden" name="bookingAge" value={bookingAge} /> : null}
              {verificationAge !== "all" ? <input type="hidden" name="verificationAge" value={verificationAge} /> : null}
              {bookingWindow !== "all" ? <input type="hidden" name="bookingWindow" value={bookingWindow} /> : null}
              {bookingPayment !== "all" ? <input type="hidden" name="bookingPayment" value={bookingPayment} /> : null}
              <input
                type="search"
                name="listingSearch"
                defaultValue={filters.listingSearch ?? ""}
                placeholder="Search listings"
                className="w-full min-w-[220px] rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-orange-400"
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
            </form>
          </div>

          <div className="mt-4 space-y-3">
            {sortedListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-300">
                No listings match this view right now.
              </div>
            ) : (
              sortedListings.map((listing) => {
                const ageMeta = getAgeMeta(listing.createdAt, listing.status === "ACTIVE" ? 10 : 4);

                return (
                  <div key={listing.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{listing.title}</h3>
                        {ageMeta ? (
                          <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${ageMeta.className}`}>
                            {ageMeta.label}
                          </span>
                        ) : null}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(listing.status)}`}>
                        {listing.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {listing.city}, {listing.state}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/admin/listings/${listing.id}`}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                      >
                        Open review
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section id="admin-booking-review" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">Booking review</h2>
              <span className="text-sm text-slate-400">{itemLabel(sortedBookings.length)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {bookingFilters.map((filter) => {
                const isActive = bookingFilter === filter.key;
                return (
                  <Link
                    key={filter.key}
                    href={buildAdminHref(filters, { bookingFilter: filter.key })}
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

            <form method="get" className="flex flex-wrap items-center gap-2">
              {listingFilter !== "all" ? <input type="hidden" name="listingFilter" value={listingFilter} /> : null}
              {verificationFilter !== "pending" ? (
                <input type="hidden" name="verificationFilter" value={verificationFilter} />
              ) : null}
              {listingSearch ? <input type="hidden" name="listingSearch" value={filters.listingSearch ?? ""} /> : null}
              {verificationSearch ? (
                <input type="hidden" name="verificationSearch" value={filters.verificationSearch ?? ""} />
              ) : null}
              {listingSort !== "age" ? <input type="hidden" name="listingSort" value={listingSort} /> : null}
              {verificationSort !== "age" ? <input type="hidden" name="verificationSort" value={verificationSort} /> : null}
              {listingAge !== "all" ? <input type="hidden" name="listingAge" value={listingAge} /> : null}
              {bookingAge !== "all" ? <input type="hidden" name="bookingAge" value={bookingAge} /> : null}
              {verificationAge !== "all" ? <input type="hidden" name="verificationAge" value={verificationAge} /> : null}
              {bookingWindow !== "all" ? <input type="hidden" name="bookingWindow" value={bookingWindow} /> : null}
              {bookingPayment !== "all" ? <input type="hidden" name="bookingPayment" value={bookingPayment} /> : null}
              {bookingFilter !== "requested" ? <input type="hidden" name="bookingFilter" value={bookingFilter} /> : null}
              <input
                type="search"
                name="bookingSearch"
                defaultValue={filters.bookingSearch ?? ""}
                placeholder="Search bookings"
                className="w-full min-w-[220px] rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-orange-400"
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
                    <p className="mt-2 text-sm text-slate-400">{booking.customerName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDate(booking.startDate)} to {formatDate(booking.endDate)}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="rounded-full bg-slate-700 px-3 py-1 text-[11px] font-medium text-slate-200">
                        {booking.paymentStatus.replaceAll("_", " ")}
                      </span>
                      <span className="font-medium text-slate-200">{formatCurrency(booking.totalAmount)}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                      >
                        Review request
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section id="admin-verification-queue" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">Verification queue</h2>
              <span className="text-sm text-slate-400">{itemLabel(sortedVerificationQueue.length)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {verificationFilters.map((filter) => {
                const isActive = verificationFilter === filter.key;
                return (
                  <Link
                    key={filter.key}
                    href={buildAdminHref(filters, { verificationFilter: filter.key })}
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

            <form method="get" className="flex flex-wrap items-center gap-2">
              {listingFilter !== "all" ? <input type="hidden" name="listingFilter" value={listingFilter} /> : null}
              {bookingFilter !== "requested" ? <input type="hidden" name="bookingFilter" value={bookingFilter} /> : null}
              {listingSearch ? <input type="hidden" name="listingSearch" value={filters.listingSearch ?? ""} /> : null}
              {bookingSearch ? <input type="hidden" name="bookingSearch" value={filters.bookingSearch ?? ""} /> : null}
              {listingSort !== "age" ? <input type="hidden" name="listingSort" value={listingSort} /> : null}
              {bookingSort !== "age" ? <input type="hidden" name="bookingSort" value={bookingSort} /> : null}
              {listingAge !== "all" ? <input type="hidden" name="listingAge" value={listingAge} /> : null}
              {bookingAge !== "all" ? <input type="hidden" name="bookingAge" value={bookingAge} /> : null}
              {verificationAge !== "all" ? <input type="hidden" name="verificationAge" value={verificationAge} /> : null}
              {bookingWindow !== "all" ? <input type="hidden" name="bookingWindow" value={bookingWindow} /> : null}
              {bookingPayment !== "all" ? <input type="hidden" name="bookingPayment" value={bookingPayment} /> : null}
              {verificationFilter !== "pending" ? (
                <input type="hidden" name="verificationFilter" value={verificationFilter} />
              ) : null}
              <input
                type="search"
                name="verificationSearch"
                defaultValue={filters.verificationSearch ?? ""}
                placeholder="Search verification"
                className="w-full min-w-[220px] rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-orange-400"
              />
              <select
                name="verificationSort"
                defaultValue={verificationSort}
                className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-orange-400"
              >
                {verificationSortOptions.map((option) => (
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
            </form>
          </div>

          <div className="mt-4 space-y-3">
            {sortedVerificationQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-300">
                No verification items match this view right now.
              </div>
            ) : (
              sortedVerificationQueue.map((booking) => {
                const ageMeta = getAgeMeta(booking.createdAt, booking.verificationStatus === "APPROVED" ? 2 : 3);

                return (
                  <div key={booking.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{booking.customerName}</h3>
                        {ageMeta ? (
                          <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${ageMeta.className}`}>
                            {ageMeta.label}
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(booking.verificationStatus)}`}
                      >
                        {booking.verificationStatus.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{booking.listingTitle}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="rounded-full bg-slate-700 px-3 py-1 text-[11px] font-medium text-slate-200">
                        {booking.paymentStatus.replaceAll("_", " ")}
                      </span>
                      <span className="font-medium text-slate-200">{formatCurrency(booking.totalAmount)}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                      >
                        Check verification
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
