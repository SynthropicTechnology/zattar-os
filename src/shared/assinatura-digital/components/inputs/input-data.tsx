'use client';

import * as React from 'react';
import { IMaskInput } from 'react-imask';
import { cn } from '@/lib/utils';

export interface InputDataProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value' | 'disabled' | 'placeholder'> {
  label?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
}

const InputData = React.forwardRef<HTMLInputElement, InputDataProps>(
  ({ label, error, className, disabled, placeholder, onChange, value, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <IMaskInput
          mask="00/00/0000"
          unmask={false}
          value={String(value ?? '')}
          disabled={disabled}
          placeholder={placeholder}
          inputRef={ref}
          onAccept={(maskedValue) => {
            if (onChange) {
              const syntheticEvent = {
                target: { value: maskedValue },
                currentTarget: { value: maskedValue }
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(syntheticEvent);
            }
          }}
          {...(props as Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'onChange' | 'disabled' | 'placeholder'>)}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
          )}
          aria-invalid={!!error}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

InputData.displayName = 'InputData';

export default InputData;