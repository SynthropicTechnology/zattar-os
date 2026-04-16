'use client';

import * as React from 'react';
import { IMaskInput } from 'react-imask';
import { cn } from '@/lib/utils';
import { INPUT_GLASS_BASE_CLASSES } from '@/components/ui/input-styles';

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
          className={cn(INPUT_GLASS_BASE_CLASSES, className)}
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