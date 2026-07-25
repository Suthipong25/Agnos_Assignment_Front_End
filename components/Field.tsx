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

const inputClass =
  "mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-clinic focus:ring-4 focus:ring-clinic/10";

export function TextField({ label, error, hint, id, ...props }: TextFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <input id={id} className={inputClass} aria-invalid={Boolean(error)} {...props} />
      <FieldNote error={error} hint={hint} />
    </label>
  );
}

export function TextArea({ label, error, hint, id, ...props }: TextAreaProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        id={id}
        className={`${inputClass} min-h-28 resize-y leading-6`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      <FieldNote error={error} hint={hint} />
    </label>
  );
}

export function SelectField({ label, error, hint, id, options, placeholder = "Select an option", ...props }: SelectFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <select id={id} className={inputClass} aria-invalid={Boolean(error)} {...props}>
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

function FieldNote({ error, hint }: { error?: string; hint?: string }) {
  if (error) {
    return <p className="mt-1.5 text-xs font-medium text-coral">{error}</p>;
  }

  if (hint) {
    return <p className="mt-1.5 text-xs text-ink/60">{hint}</p>;
  }

  return null;
}
