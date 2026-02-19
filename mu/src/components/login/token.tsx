import React, { ChangeEvent, useRef } from "react";

interface TokenInputProps {
  value: string;
  handleChange: (value: string) => void;
}

const TokenInput: React.FC<TokenInputProps> = ({ value, handleChange }) => {
  const inputsRef = useRef<HTMLInputElement[]>([]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = value.split("");
    newValue[index] = e.target.value;
    handleChange(newValue.join(""));

    // Move focus to the next input field
    if (e.target.value !== "" && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Move focus to the previous input field
    if (e.target.value === "" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && index > 0 && value[index] === "") {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex space-x-2 w-full">
      {Array(6)
        .fill("")
        .map((_, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            inputMode="numeric"
            className="mt-4 mb-4 flex-1 min-w-0 h-12 p-3 text-center focus:outline outline-blue-800 dark:outline-blue-200 dark:placeholder-white dark:text-white text-black placeholder-black dark:placeholder-white bg-gray-300 dark:bg-gray-700 rounded-md cursor-pointer text-md"
            value={value[index] || ""}
            onChange={(e) => handleInputChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            ref={(input) => {
              if (input) {
                inputsRef.current[index] = input;
              }
            }}
          />
        ))}
    </div>
  );
};

export default TokenInput;