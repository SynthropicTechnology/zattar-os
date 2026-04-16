'use client';

import * as React from 'react';
import { IMaskInput } from 'react-imask';
import { cn } from '@/lib/utils';
import { INPUT_GLASS_BASE_CLASSES } from '@/components/ui/input-styles';

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
          className={cn(INPUT_GLASS_BASE_CLASSES, className)}
          aria-invalid={!!error}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

InputCPFCNPJ.displayName = 'InputCPFCNPJ';

export default InputCPFCNPJ;