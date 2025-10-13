"use client";

import React from 'react';

type FormFieldProps = {
  id?: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({ id, label, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default FormField;
