'use client';

import * as React from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

type CheckboxProps = Omit<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  'onCheckedChange' | 'checked'
> & {
  onCheckedChange?: (_value: boolean | 'indeterminate') => void;
  checked?: boolean | 'indeterminate';
};

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, onCheckedChange, checked, ...props }, ref) => {
  // Normalize Radix CheckedState to a caller-friendly value.
  // If caller expects a boolean, they'll receive true/false; indeterminate is passed as 'indeterminate'.
  const handleCheckedChange = (value: CheckedState) => {
    if (!onCheckedChange) return;

    // Preserve original shape where possible
    // Callers that expect boolean will get true/false; others may receive 'indeterminate'.
    function normalizeCheckedValue(val: CheckedState): boolean | 'indeterminate' {
      if (val === true) return true;
      if (val === 'indeterminate') return 'indeterminate';
      return false;
    }

    const normalized: boolean | 'indeterminate' = normalizeCheckedValue(value);
    onCheckedChange(normalized);
  };

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        className
      )}
      onCheckedChange={handleCheckedChange}
      checked={checked as CheckedState}
      {...(props as any)}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
