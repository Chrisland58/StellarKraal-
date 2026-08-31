"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * NotFoundSearch — #1097
 *
 * A client-side search bar rendered on the 404 page.
 * Submitting the form navigates to /help/faq with the query pre-filled,
 * which is the closest discovery surface in the app.
 */
export default function NotFoundSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/help/faq?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search StellarKraal"
      className="w-full max-w-md"
    >
      <label htmlFor="not-found-search" className="sr-only">
        Search StellarKraal
      </label>
      <div className="flex gap-2">
        <input
          id="not-found-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for help, loans, collateral…"
          autoComplete="off"
          className="flex-1 rounded-xl border border-brown/30 px-4 py-3 text-brown placeholder-brown/40
            bg-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition text-sm"
        />
        <button
          type="submit"
          aria-label="Submit search"
          className="bg-brown text-cream font-semibold px-5 py-3 rounded-xl hover:bg-brown/80
            transition focus:outline-none focus:ring-2 focus:ring-gold text-sm"
        >
          Search
        </button>
      </div>
    </form>
  );
}
