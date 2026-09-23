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
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="contact-name">Nome</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="form-field">
        <label htmlFor="contact-email">E-mail</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="form-field">
        <label htmlFor="contact-message">Mensagem</label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
      <button type="submit" className="button button-primary">
        Enviar mensagem
      </button>
    </form>
  )
}
