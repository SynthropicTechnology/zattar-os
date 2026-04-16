'use client';

import * as React from 'react';
import { IMaskInput } from 'react-imask';
import { cn } from '@/lib/utils';
import { INPUT_GLASS_BASE_CLASSES } from '@/components/ui/input-styles';

export interface InputCPFProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const InputCPF = React.forwardRef<HTMLInputElement, InputCPFProps>(
  ({ label, error, className, disabled, onChange, onBlur, onFocus, value, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <IMaskInput
          mask="000.000.000-00"
          unmask={false}
          value={value as string}
          disabled={disabled}
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
          onBlur={onBlur}
          onFocus={onFocus}
          {...props}
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

InputCPF.displayName = 'InputCPF';

export default InputCPF;
