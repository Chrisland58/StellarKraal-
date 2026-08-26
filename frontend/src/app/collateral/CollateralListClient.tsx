'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchFilterBar from '@/components/SearchFilterBar';
import HighlightText from '@/components/HighlightText';
import PageTransition from '@/components/PageTransition';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import MoneyAmount from '@/components/MoneyAmount';

interface Collateral {
  id: string;
  owner: string;
  animal_type: string;
  count: number;
  appraised_value: number;
}

const STATUS_OPTIONS: string[] = [];
const TYPE_OPTIONS = ['cattle', 'goat', 'sheep', 'pig', 'poultry'];
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function CollateralListContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Collateral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/collateral`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const q = (searchParams.get('q') ?? '').toLowerCase();
  const types = searchParams.getAll('type');

  const filtered = items.filter((col) => {
    const matchesQuery =
      !q ||
      col.id.toLowerCase().includes(q) ||
      col.owner.toLowerCase().includes(q) ||
      col.animal_type.toLowerCase().includes(q);
    const matchesType = types.length === 0 || types.includes(col.animal_type);
    return matchesQuery && matchesType;
  });

  return (
    <div className="space-y-4">
      <SearchFilterBar
        statusOptions={STATUS_OPTIONS}
        typeOptions={TYPE_OPTIONS}
        searchPlaceholder="Search by ID, owner, or animal type…"
      />
      {loading ? (
        <p className="text-brown/60 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/60 text-sm">No collateral matches your filters.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((col) => (
            <li
              key={col.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-brown/10 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-brown text-sm capitalize">
                  <HighlightText text={col.animal_type} query={q} /> — {col.count} head
                </p>
                <p className="text-xs text-brown/60 truncate max-w-xs">
                  <HighlightText text={col.owner} query={q} />
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-brown dark:text-cream-50">
                  <MoneyAmount value={col.appraised_value} fromStroops interactive={false} />
                </p>
                <p className="text-xs text-brown/50">
                  ID: <HighlightText text={col.id} query={q} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CollateralListClient() {
  useScrollPosition();

  return (
    <PageTransition>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-brown mb-6">Collateral</h1>
        <Suspense fallback={<p className="text-brown/60 text-sm">Loading…</p>}>
          <CollateralListContent />
        </Suspense>
      </main>
    </PageTransition>
  );
}
