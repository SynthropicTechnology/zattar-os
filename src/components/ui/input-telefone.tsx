'use client';

import * as React from 'react';
import { IMaskInput } from 'react-imask';
import { cn } from '@/lib/utils';
import { INPUT_GLASS_BASE_CLASSES } from '@/components/ui/input-styles';

export interface InputTelefoneProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'onBlur'> {
  label?: string;
  error?: string;
  mode?: 'auto' | 'cell' | 'landline';
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const inputClassName = INPUT_GLASS_BASE_CLASSES;

const InputTelefone = React.forwardRef<HTMLInputElement, InputTelefoneProps>(
  ({ label, error, className, mode = 'auto', onChange, onBlur, value, ...props }, ref) => {
    // Estado interno para controlar o valor quando o componente é controlado
    const [internalValue, setInternalValue] = React.useState(value as string || '');

    // Sincronizar valor externo com interno
    React.useEffect(() => {
      setInternalValue(value as string || '');
    }, [value]);

    const handleAccept = React.useCallback((maskedValue: string) => {
      setInternalValue(maskedValue);
      if (onChange) {
        const syntheticEvent = {
          target: { value: maskedValue },
          currentTarget: { value: maskedValue }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }, [onChange]);

    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(e);
      }
    }, [onBlur]);

    if (mode === 'cell') {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </label>
          )}
          <IMaskInput
            mask="(00) 00000-0000"
            unmask={false}
            value={internalValue}
            inputRef={ref}
            onAccept={handleAccept}
            onBlur={handleBlur}
            {...props}
            className={cn(inputClassName, className)}
            aria-invalid={!!error}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      );
    }

    if (mode === 'landline') {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </label>
          )}
          <IMaskInput
            mask="(00) 0000-0000"
            unmask={false}
            value={internalValue}
            inputRef={ref}
            onAccept={handleAccept}
            onBlur={handleBlur}
            {...props}
            className={cn(inputClassName, className)}
            aria-invalid={!!error}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      );
    }

    // Auto mode - dynamic mask (like InputCPFCNPJ)
    const mask = [
      { mask: '(00) 0000-0000' },    // Landline
      { mask: '(00) 00000-0000' }    // Cell phone
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
            return dynamicMasked.compiledMasks[number.length > 10 ? 1 : 0];
          }}
          unmask={false}
          value={internalValue}
          inputRef={ref}
          onAccept={handleAccept}
          onBlur={handleBlur}
          {...props}
          className={cn(inputClassName, className)}
          aria-invalid={!!error}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

InputTelefone.displayName = 'InputTelefone';

export { InputTelefone };
