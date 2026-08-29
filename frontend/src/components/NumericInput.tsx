"use client";
import { forwardRef, useCallback, useState, useEffect } from "react";
import { Input, type InputProps } from "@/components/ui/FormField";

/**
 * NumericInput — #567
 *
 * A controlled input that:
 *  - Only accepts numeric characters (strips letters, symbols, spaces)
 *  - Displays the value with thousands-separator formatting (e.g. "10,000")
 *  - Exposes the underlying plain numeric string (no commas) via onChange
 *  - Shows the mobile numeric keyboard with inputMode="numeric"
 *
 * Usage:
 *   <NumericInput
 *     label="Loan Amount (stroops)"
 *     value={loanAmount}           // plain number string: "10000"
 *     onChange={(e) => setField("loanAmount", e.target.value)} // receives "10000"
 *   />
 */

export interface NumericInputProps
  extends Omit<InputProps, "type" | "inputMode" | "onChange"> {
  /** Plain numeric string without formatting (the form state value). */
  value?: string;
  /** Called with a synthetic-event-like object where `target.value` is the
   *  raw numeric string (digits only, no commas). */
  onChange?: (event: { target: { value: string } }) => void;
}

/** Strip all non-digit characters from a string. */
function stripNonDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Format a plain numeric string with locale thousands separators.
 *  Returns an empty string for empty/zero input to avoid showing "0". */
function formatWithSeparator(plain: string): string {
  if (!plain) return "";
  const n = parseInt(plain, 10);
  if (isNaN(n)) return "";
  return n.toLocaleString("en-US");
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput({ value = "", onChange, ...props }, ref) {
    // Display value (with commas)
    const [displayValue, setDisplayValue] = useState(() =>
      formatWithSeparator(value)
    );

    // Sync display when external value changes (e.g. programmatic reset)
    useEffect(() => {
      setDisplayValue(formatWithSeparator(value));
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Strip non-digit characters — this handles paste of formatted text too
        const digits = stripNonDigits(raw);
        // Update display value with thousands separator
        setDisplayValue(formatWithSeparator(digits));
        // Notify parent with plain numeric string (no commas)
        onChange?.({ target: { value: digits } });
      },
      [onChange]
    );

    return (
      <Input
        ref={ref}
        // Controlled display value (formatted)
        value={displayValue}
        onChange={handleChange}
        // Semantics: tell the browser this is numeric text
        type="text"
        inputMode="numeric"
        pattern="[0-9,]*"
        autoComplete="off"
        {...props}
      />
    );
  }
);

export default NumericInput;
