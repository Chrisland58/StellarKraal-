"use client";
import { useRef } from "react";
import { useWizard, AnimalType, CollateralItem, makeItem } from "@/context/LoanWizardContext";
import { signTransaction } from "@/lib/freighterClient";
import { submitSignedXdr } from "@/lib/stellarUtils";
import { invalidateCollateral } from "@/lib/api";
import Spinner from "@/components/Spinner";

const ANIMAL_TYPES: { value: AnimalType; label: string; emoji: string }[] = [
  { value: "cattle", label: "Cattle", emoji: "🐄" },
  { value: "goat", label: "Goat", emoji: "🐐" },
  { value: "sheep", label: "Sheep", emoji: "🐑" },
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Props {
  walletAddress: string;
}

export default function StepCollateral({ walletAddress }: Props) {
  const { collaterals, loading, error, setField, setCollaterals, nextStep } = useWizard();
  const dragIndexRef = useRef<number | null>(null);

  // ── Item helpers ────────────────────────────────────────────────────────────

  function updateItem(index: number, patch: Partial<CollateralItem>) {
    setCollaterals(collaterals.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function addItem() {
    setCollaterals([...collaterals, makeItem()]);
  }

  function removeItem(index: number) {
    if (collaterals.length === 1) return;
    setCollaterals(collaterals.filter((_, i) => i !== index));
  }

  function moveItem(from: number, to: number) {
    if (from === to) return;
    const next = [...collaterals];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setCollaterals(next);
  }

  // ── Keyboard reorder ────────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      moveItem(index, index - 1);
    } else if (e.key === "ArrowDown" && index < collaterals.length - 1) {
      e.preventDefault();
      moveItem(index, index + 1);
    }
  }

  // ── Pointer drag ─────────────────────────────────────────────────────────────

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>, index: number) {
    // Only drag from the handle
    dragIndexRef.current = index;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragStart(e: React.DragEvent, index: number) {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
      moveItem(dragIndexRef.current, index);
      dragIndexRef.current = index;
    }
  }

  function onDragEnd() {
    dragIndexRef.current = null;
  }

  // ── Validation & submit ──────────────────────────────────────────────────────

  function validate(): string | null {
    for (let i = 0; i < collaterals.length; i++) {
      const c = collaterals[i];
      if (!c.count || parseInt(c.count) < 1) return `Item ${i + 1}: enter at least 1 animal.`;
      if (!c.appraisedValue || parseInt(c.appraisedValue) < 1)
        return `Item ${i + 1}: enter a valid appraised value.`;
    }
    return null;
  }

  async function handleRegister() {
    const err = validate();
    if (err) { setField("error", err); return; }

    setField("loading", true);
    setField("error", null);
    try {
      const res = await fetch(`${API}/api/collateral/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: walletAddress,
          animal_type: animalType,
          count: parseInt(count),
          appraised_value: parseInt(appraisedValue),
        }),
      });
      if (!res.ok) throw new Error("Registration failed. Please try again.");
      const { xdr } = await res.json();
      const { signedTxXdr } = await signTransaction(xdr, {
        network: process.env.NEXT_PUBLIC_NETWORK || "TESTNET",
      });
      const collateralId = await submitSignedXdr(signedTxXdr);
      // New collateral registered — drop cached collateral lists so they revalidate.
      invalidateCollateral();
      setField("collateralId", String(collateralId));
      nextStep();
    } catch (e: any) {
      setField("error", e.message || "Something went wrong.");
    } finally {
      setField("loading", false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brown">Select Your Collateral</h2>
        <p className="text-brown/60 mt-1 text-sm">
          Add one or more livestock items. Drag to prioritise which is pledged first.
        </p>
      </div>

      <ul aria-label="Collateral items" className="space-y-3">
        {collaterals.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            className="border border-brown/20 rounded-xl p-4 bg-white flex gap-3 items-start"
          >
            {/* Drag handle */}
            <div
              role="button"
              aria-label="Drag to reorder"
              tabIndex={0}
              onPointerDown={(e) => onPointerDown(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="cursor-grab active:cursor-grabbing mt-1 text-brown/30 hover:text-brown/60 select-none focus:outline-none focus:ring-2 focus:ring-gold rounded"
              title="Drag to reorder or use arrow keys"
            >
              {/* Grip icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="4" r="1.5" /><circle cx="11" cy="4" r="1.5" />
                <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="12" r="1.5" /><circle cx="11" cy="12" r="1.5" />
              </svg>
            </div>

      <Input
        label="Number of Animals"
        type="number"
        min="1"
        placeholder="e.g. 5"
        value={count}
        onChange={(e) => setField("count", e.target.value)}
        disabled={loading}
      />

      <div>
        <Input
          label="Total Appraised Value (stroops)"
          type="number"
          min="1"
          placeholder="e.g. 10000000"
          value={appraisedValue}
          onChange={(e) => setField("appraisedValue", e.target.value)}
          disabled={loading}
        />
        {count && appraisedValue && (
          <p className="text-xs text-brown-400 mt-1">
            ≈ {(parseInt(appraisedValue) / parseInt(count) / 10_000_000).toFixed(2)} XLM per head
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="bg-error-light border border-error rounded-xl px-4 py-3 text-error-dark text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full bg-brown text-cream py-3 rounded-xl font-semibold hover:bg-brown/80 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Spinner />
            Registering on-chain…
          </>
        ) : (
          "Register & Continue →"
        )}
      </button>
    </div>
  );
}
