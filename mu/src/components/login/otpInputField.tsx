import { useRef } from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function OTPInput({ value, onChange, error }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        onChange(next.join(""));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = "";
        onChange(next.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;

    // Handle paste of multiple digits
    if (raw.length > 1) {
      const pasted = raw.slice(0, 6).split("");
      const next = [...digits];
      pasted.forEach((char, i) => {
        if (index + i < 6) next[index + i] = char;
      });
      onChange(next.join(""));
      const focusIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = raw;
    onChange(next.join(""));
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] || "");
    onChange(next.join(""));
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex gap-1.5 sm:gap-2 md:gap-3 justify-center w-full">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            style={{ animationDelay: `${index * 60}ms` }}
            className={`
              rise
              w-11 h-12 md:w-13 md:h-14 text-center text-xl font-semibold
              rounded-xl border-2 bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              outline-none transition-all duration-200 caret-transparent
              ${digit ? "border-blue-400 dark:border-blue-500 shadow-sm shadow-blue-200 dark:shadow-blue-900" : "border-gray-200 dark:border-gray-600"}
              ${error ? "border-red-400 dark:border-red-500 shake" : ""}
              focus:border-blue-500 dark:focus:border-blue-400
              focus:shadow-md focus:shadow-blue-200 dark:focus:shadow-blue-900
              hover:border-gray-300 dark:hover:border-gray-500
            `}
          />
        ))}
      </div>
      {error && (
        <p className="fade-in text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
