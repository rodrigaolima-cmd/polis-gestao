import * as React from "react";
import { Input } from "@/components/ui/input";
import { parseCurrencyInput, formatCurrencyInput } from "@/utils/contractUtils";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number | null | undefined;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

export function CurrencyInput({ value: rawValue, onChange, className, placeholder = "0,00" }: CurrencyInputProps) {
  const value = rawValue ?? 0;
  const [display, setDisplay] = React.useState(formatCurrencyInput(value));
  const [focused, setFocused] = React.useState(false);

  // Sync display whenever value changes externally and field is not focused
  React.useEffect(() => {
    if (!focused) {
      setDisplay(formatCurrencyInput(value));
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(e.target.value);
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseCurrencyInput(display);
    onChange(parsed);
    setDisplay(formatCurrencyInput(parsed));
  };

  const handleFocus = () => {
    setFocused(true);
    // Always derive from the current prop value, not stale state
    if (value) {
      setDisplay(String(value).replace(".", ","));
    } else {
      setDisplay("");
    }
  };

  return (
    <Input
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={cn(className)}
      inputMode="decimal"
    />
  );
}
