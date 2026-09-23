"use client"

import { useState, type FormEvent } from "react"

import { CONTACT_EMAIL } from "@/data/home-content"

/**
 * The site has no backend yet, so submission builds a mailto: link from the
 * filled fields — the same delivery mechanism every other CTA on the site
 * already uses (see home-content.ts). Swap the submit handler for a real
 * API call if/when the project adds one; the field state and validation
 * stay the same.
 */
export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const subject = `Contato pelo site — ${name}`
    const body = `${message}\n\n${email}`
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    window.location.href = mailto
  }

  return (
    <form
      className="flex flex-col gap-[calc(20*var(--unit))] max-w-[calc(480*var(--unit))]"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-[calc(8*var(--unit))]">
        <label
          htmlFor="contact-name"
          className="text-[#bcbcc3] text-[calc(12*var(--unit))] font-[550] tracking-[0.05em]"
        >
          Nome
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="px-[calc(14*var(--unit))] py-[calc(12*var(--unit))] border border-[#3a3b39] rounded-[calc(4*var(--unit))] bg-[#131413] text-[#f0f0f1] [font:inherit] text-[calc(13*var(--unit))] resize-y focus-visible:outline-2 focus-visible:outline-vexiom-yellow focus-visible:outline-offset-2"
        />
      </div>
      <div className="flex flex-col gap-[calc(8*var(--unit))]">
        <label
          htmlFor="contact-email"
          className="text-[#bcbcc3] text-[calc(12*var(--unit))] font-[550] tracking-[0.05em]"
        >
          E-mail
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="px-[calc(14*var(--unit))] py-[calc(12*var(--unit))] border border-[#3a3b39] rounded-[calc(4*var(--unit))] bg-[#131413] text-[#f0f0f1] [font:inherit] text-[calc(13*var(--unit))] resize-y focus-visible:outline-2 focus-visible:outline-vexiom-yellow focus-visible:outline-offset-2"
        />
      </div>
      <div className="flex flex-col gap-[calc(8*var(--unit))]">
        <label
          htmlFor="contact-message"
          className="text-[#bcbcc3] text-[calc(12*var(--unit))] font-[550] tracking-[0.05em]"
        >
          Mensagem
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="px-[calc(14*var(--unit))] py-[calc(12*var(--unit))] border border-[#3a3b39] rounded-[calc(4*var(--unit))] bg-[#131413] text-[#f0f0f1] [font:inherit] text-[calc(13*var(--unit))] resize-y focus-visible:outline-2 focus-visible:outline-vexiom-yellow focus-visible:outline-offset-2"
        />
      </div>
      <button
        type="submit"
        className="relative isolate inline-flex items-center justify-center gap-[calc(28*var(--unit))] h-[calc(49*var(--unit))] text-[calc(14*var(--unit))] font-[750] tracking-[-0.035em] [@media(max-width:650px)]:h-[46px] [@media(max-width:650px)]:text-[11px] [@media(max-width:650px)]:gap-[14px] [@media(max-width:360px)]:text-[10px] [@media(max-width:360px)]:gap-[10px] w-[calc(251*var(--unit))] text-[#111] before:content-[''] before:absolute before:inset-0 before:z-[-2] before:[clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] before:bg-[linear-gradient(110deg,#ffe414,#ffdd09)] hover:before:bg-[#ffed4c] [@media(max-width:650px)]:w-[58%] self-start mt-[calc(10*var(--unit))] border-none cursor-pointer"
      >
        Enviar mensagem
      </button>
    </form>
  )
}
