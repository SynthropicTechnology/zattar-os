'use client';

import * as React from 'react';
import { IMaskInput } from 'react-imask';
import { cn } from '@/lib/utils';

export interface InputCPFCNPJProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'onBlur'> {
  label?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const InputCPFCNPJ = React.forwardRef<HTMLInputElement, InputCPFCNPJProps>(
  ({ label, error, className, onChange, onBlur, value, ...props }, ref) => {
    // Dynamic mask: CPF or CNPJ
    const mask = [
      { mask: '000.000.000-00' },          // CPF (11 digits)
      { mask: '00.000.000/0000-00' }       // CNPJ (14 digits)
    ];

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <IMaskInput
          mask={mask}
          dispatch={(appended, dynamicMasked) => {
            const number = (dynamicMasked.value + appended).replace(/\D/g, '');
            return dynamicMasked.compiledMasks[number.length <= 11 ? 0 : 1];
          }}
          unmask={false}
          value={value as string}
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
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            if (onBlur) {
              onBlur(e);
            }
          }}
          {...props}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
          )}
          aria-invalid={!!error}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

InputCPFCNPJ.displayName = 'InputCPFCNPJ';

export default InputCPFCNPJ;