import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  error?: string;
  hint?: string;
};

type TextFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
type SelectFieldProps = BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: string[];
    placeholder?: string;
  };

const inputBase =
  "mt-1.5 w-full rounded-xl border bg-white/90 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-150";
const inputNormal = "border-line hover:border-ink/30 focus:border-clinic focus:ring-4 focus:ring-clinic/10";
const inputError  = "border-coral/60 bg-coral/5 focus:border-coral focus:ring-4 focus:ring-coral/10";

function inputClass(error?: string) {
  return `${inputBase} ${error ? inputError : inputNormal}`;
}

export function TextField({ label, error, hint, id, required, ...props }: TextFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <FieldLabel label={label} required={required} />
      <input id={id} className={inputClass(error)} aria-invalid={Boolean(error)} required={required} {...props} />
      <FieldNote error={error} hint={hint} />
    </label>
  );
}

export function TextArea({ label, error, hint, id, required, ...props }: TextAreaProps) {
  return (
    <label className="block" htmlFor={id}>
      <FieldLabel label={label} required={required} />
      <textarea
        id={id}
        className={`${inputClass(error)} min-h-28 resize-y leading-6`}
        aria-invalid={Boolean(error)}
        required={required}
        {...props}
      />
      <FieldNote error={error} hint={hint} />
    </label>
  );
}

export function SelectField({ label, error, hint, id, options, required, placeholder = "Select an option", ...props }: SelectFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <FieldLabel label={label} required={required} />
      <select id={id} className={inputClass(error)} aria-invalid={Boolean(error)} required={required} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldNote error={error} hint={hint} />
    </label>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="flex items-center gap-1 text-sm font-semibold text-ink/80">
      {label}
      {required && <span className="text-coral" aria-hidden="true">*</span>}
    </span>
  );
}

function FieldNote({ error, hint }: { error?: string; hint?: string }) {
  if (error) {
    return <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-coral">⚠ {error}</p>;
  }

  if (hint) {
    return <p className="mt-1.5 text-xs text-ink/50">{hint}</p>;
  }

  return null;
}
