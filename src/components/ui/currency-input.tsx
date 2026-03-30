import * as React from "react";
import { Input } from "@/components/ui/input";
import { parseCurrencyInput, formatCurrencyInput } from "@/utils/contractUtils";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

export function CurrencyInput({ value, onChange, className, placeholder = "0,00" }: CurrencyInputProps) {
  const [display, setDisplay] = React.useState(formatCurrencyInput(value));
  const [focused, setFocused] = React.useState(false);

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
    // Show raw number for easier editing
    if (value) {
      setDisplay(String(value).replace(".", ","));
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
