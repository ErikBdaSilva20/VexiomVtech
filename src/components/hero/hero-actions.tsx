import { HERO_PRIMARY_CTA, HERO_SECONDARY_CTA } from "@/data/home-content";
import { ArrowLink } from "@/components/shared/arrow-link";

/** Primary + secondary hero CTAs — primary mails in, secondary jumps to #servicos. */
export function HeroActions() {
  return (
    <div className="hero-actions">
      <ArrowLink
        className="button button-primary"
        href={HERO_PRIMARY_CTA.href}
      >
        <p className="text-black">{HERO_PRIMARY_CTA.label}</p>
      </ArrowLink>
      <a className="button button-secondary" href={HERO_SECONDARY_CTA.href}>
        {HERO_SECONDARY_CTA.label}
      </a>
    </div>
  );
}
