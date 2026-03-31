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

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value: rawValue, onChange, className, placeholder = "0,00" }, ref) => {
    const value = rawValue ?? 0;
    const [display, setDisplay] = React.useState(formatCurrencyInput(value));
    const [focused, setFocused] = React.useState(false);

    React.useEffect(() => {
      if (!focused) {
        setDisplay(formatCurrencyInput(value));
      }
    }, [value, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setDisplay(raw);
      onChange(parseCurrencyInput(raw));
    };

    const handleBlur = () => {
      setFocused(false);
      const parsed = parseCurrencyInput(display);
      onChange(parsed);
      setDisplay(formatCurrencyInput(parsed));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      if (value) {
        setDisplay(String(value).replace(".", ","));
      } else {
        setDisplay("");
      }
      requestAnimationFrame(() => e.target.select());
    };

    return (
      <Input
        ref={ref}
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
);

CurrencyInput.displayName = "CurrencyInput";
