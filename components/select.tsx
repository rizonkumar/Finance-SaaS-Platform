"use client";

import { useMemo } from "react";
import { type SingleValue } from "react-select";
import CreateableSelect from "react-select/creatable";

type Props = {
  onChange: (value?: string) => void;
  onCreate?: (value: string) => void;
  options?: { label: string; value: string }[];
  value?: string | null;
  disabled?: boolean;
  placeholder?: string;
};

const optionBackground = (state: {
  isSelected: boolean;
  isFocused: boolean;
}) => {
  if (state.isSelected) return "var(--gray-alpha-300)";
  if (state.isFocused) return "var(--gray-alpha-100)";

  return "transparent";
};

export const Select = ({
  value,
  onChange,
  disabled,
  onCreate,
  options = [],
  placeholder,
}: Props) => {
  const onSelect = (option: SingleValue<{ label: string; value: string }>) => {
    onChange(option?.value);
  };

  const formattedValue = useMemo(() => {
    return options.find((option) => option.value === value);
  }, [options, value]);

  return (
    <CreateableSelect
      placeholder={placeholder}
      className="text-sm"
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 40,
          backgroundColor: "var(--background-200)",
          borderColor: state.isFocused
            ? "var(--blue-700)"
            : "var(--gray-alpha-400)",
          borderRadius: "var(--radius-sm-value)",
          boxShadow: "none",
          ":hover": { borderColor: "var(--gray-alpha-500)" },
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: "var(--background-200)",
          border: "1px solid var(--gray-alpha-300)",
          borderRadius: "var(--radius-sm-value)",
          boxShadow: "var(--shadow-popover-value)",
          overflow: "hidden",
          zIndex: 50,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: optionBackground(state),
          color: "var(--gray-1000)",
          ":active": { backgroundColor: "var(--gray-alpha-300)" },
        }),
        singleValue: (base) => ({ ...base, color: "var(--gray-1000)" }),
        input: (base) => ({ ...base, color: "var(--gray-1000)" }),
        placeholder: (base) => ({ ...base, color: "var(--gray-700)" }),
        indicatorSeparator: (base) => ({
          ...base,
          backgroundColor: "var(--gray-alpha-300)",
        }),
        dropdownIndicator: (base) => ({ ...base, color: "var(--gray-700)" }),
      }}
      value={formattedValue}
      onChange={onSelect}
      options={options}
      onCreateOption={onCreate}
      isDisabled={disabled}
    />
  );
};
