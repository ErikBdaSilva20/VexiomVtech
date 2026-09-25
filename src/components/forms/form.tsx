import type {
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"

import { cn } from "@/lib/utils"

const fieldLabelClassName =
  "text-[#bcbcc3] text-[calc(12*var(--unit))] font-[550] tracking-[0.05em]"

const controlClassName =
  "w-full min-w-0 px-[calc(14*var(--unit))] py-[calc(12*var(--unit))] border border-[#3a3b39] rounded-[calc(4*var(--unit))] bg-[#131413] text-[#f0f0f1] [font:inherit] text-[calc(13*var(--unit))] [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-vexiom-yellow focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-[#b85c5c]"

const submitButtonClassName =
  "relative isolate inline-flex items-center justify-center gap-[calc(28*var(--unit))] px-[calc(24*var(--unit))] h-[calc(49*var(--unit))] text-[calc(14*var(--unit))] font-[750] tracking-[-0.035em] whitespace-nowrap [@media(max-width:650px)]:h-[46px] [@media(max-width:650px)]:text-[11px] [@media(max-width:650px)]:gap-[14px] [@media(max-width:650px)]:px-[16px] [@media(max-width:360px)]:text-[10px] [@media(max-width:360px)]:gap-[10px] [@media(max-width:360px)]:px-[12px] w-[calc(251*var(--unit))] text-[#111] before:content-[''] before:absolute before:inset-0 before:z-[-2] before:[clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] before:bg-[linear-gradient(110deg,#ffe414,#ffdd09)] hover:before:bg-[#ffed4c] [@media(max-width:650px)]:w-[58%] self-start mt-[calc(10*var(--unit))] border-none cursor-pointer focus-visible:outline-2 focus-visible:outline-vexiom-yellow focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"

type FormProps = FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode
}

export function Form({ className, children, ...props }: FormProps) {
  return (
    <form
      className={cn("flex flex-col gap-[calc(20*var(--unit))]", className)}
      {...props}
    >
      {children}
    </form>
  )
}

type FormFieldProps = {
  children: ReactNode
  className?: string
  error?: string
  hint?: string
  htmlFor: string
  label: ReactNode
}

export function FormField({
  children,
  className,
  error,
  hint,
  htmlFor,
  label,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-[calc(8*var(--unit))]", className)}>
      <label htmlFor={htmlFor} className={fieldLabelClassName}>
        {label}
      </label>
      {children}
      {hint && (
        <p
          id={htmlFor + "-hint"}
          className="text-[11px] leading-[1.5] text-[#858782]"
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={htmlFor + "-error"}
          className="text-[11px] leading-[1.5] text-[#ffb4b4]"
        >
          {error}
        </p>
      )}
    </div>
  )
}

type FormInputProps = InputHTMLAttributes<HTMLInputElement>

export function FormInput({ className, ...props }: FormInputProps) {
  return <input className={cn(controlClassName, className)} {...props} />
}

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function FormTextarea({ className, ...props }: FormTextareaProps) {
  return (
    <textarea
      className={cn(controlClassName, "resize-y", className)}
      {...props}
    />
  )
}

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function FormSelect({ className, ...props }: FormSelectProps) {
  return <select className={cn(controlClassName, className)} {...props} />
}

type FormSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function FormSubmitButton({
  children,
  className,
  type = "submit",
  ...props
}: FormSubmitButtonProps) {
  return (
    <button
      type={type}
      className={cn(submitButtonClassName, className)}
      {...props}
    >
      {children}
    </button>
  )
}
