import type { Metadata } from "next"
import Link from "next/link"

import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Entrar no painel - Vexiom",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[#0b0c0b] px-[calc(24*var(--unit))] py-[calc(48*var(--unit))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[12%] -top-[24%] -z-10 h-[min(72vw,760px)] w-[min(72vw,760px)] rounded-full bg-[radial-gradient(circle,rgba(251,208,32,0.10)_0%,rgba(251,208,32,0.025)_38%,transparent_70%)]"
      />
      <section
        aria-labelledby="login-title"
        className="w-full max-w-[460px] rounded-[8px] border border-[#292b28] bg-[#101110] px-[clamp(24px,6vw,48px)] py-[clamp(28px,6vw,48px)] shadow-[0_24px_90px_rgba(0,0,0,0.38)]"
      >
        <Link
          href="/"
          aria-label="Vexiom - página inicial"
          className="mb-[calc(42*var(--unit))] inline-flex items-center gap-[12px] rounded-sm text-[#f0f0f1] outline-offset-4 focus-visible:outline-2 focus-visible:outline-vexiom-yellow"
        >
          <span className="flex size-[34px] items-center justify-center border border-vexiom-yellow text-[19px] font-[800] leading-none text-vexiom-yellow">
            V
          </span>
          <span className="text-[14px] font-[750] tracking-[0.2em]">VEXIOM</span>
        </Link>

        <p className="mb-[10px] text-[11px] font-[650] tracking-[0.18em] text-vexiom-yellow">
          PAINEL ADMINISTRATIVO
        </p>
        <h1
          id="login-title"
          className="text-[clamp(30px,5vw,38px)] font-[700] leading-[1.12] tracking-[-0.045em] text-[#f4f4f4]"
        >
          Entre na sua conta
        </h1>
        <p className="mb-[calc(30*var(--unit))] mt-[12px] text-[14px] leading-[1.65] text-[#a9aaa7]">
          Acesse o espaço de gestão da Vexiom com seu e-mail e senha.
        </p>

        <LoginForm />

        <p className="mt-[calc(28*var(--unit))] border-t border-[#292b28] pt-[calc(18*var(--unit))] text-[11px] leading-[1.6] text-[#777a75]">
          Acesso restrito à equipe Vexiom.
        </p>
      </section>
    </main>
  )
}
