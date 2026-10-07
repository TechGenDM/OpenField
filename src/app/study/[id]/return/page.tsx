"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function ReturnPlaceholderPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-emerald-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-zinc-950">You&apos;re Back from the Field</h1>
      <p className="text-sm text-zinc-600 max-w-md">
        Screen 4 (Return: uploading photos and typing observations) will be implemented in Task #4.
        Your protocol &quot;{id}&quot; remains safely stored in your browser.
      </p>
      <div className="flex gap-3 pt-2">
        <Link
          href={`/study/${id}/field`}
          className="px-4 py-2 rounded-xl border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition"
        >
          &larr; Back to Field Mode
        </Link>
        <Link
          href={`/study/${id}`}
          className="px-4 py-2 rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-800 transition"
        >
          View Field Card
        </Link>
      </div>
    </div>
  );
}
