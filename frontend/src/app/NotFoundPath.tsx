"use client";
import { usePathname } from "next/navigation";

/**
 * Displays the invalid path that triggered the 404.
 * Must be a client component because usePathname() is a client-only hook.
 */
export default function NotFoundPath() {
  const pathname = usePathname();

  if (!pathname) return null;

  return (
    <p className="text-sm text-brown/50 mb-4 font-mono bg-brown/5 px-3 py-1 rounded-lg inline-block">
      <span className="sr-only">Requested path: </span>
      {pathname}
    </p>
  );
}
