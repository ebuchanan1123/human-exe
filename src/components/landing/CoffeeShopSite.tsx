import type { ReactNode } from "react";
import { Clock, Coffee, Croissant, CupSoda, Leaf, MapPin, ShoppingBag } from "lucide-react";

interface CoffeeShopSiteProps {
  /** The verification widget, shown in the hero. */
  widget: ReactNode;
}

const MENU = [
  {
    name: "Honey Oat Latte",
    blurb: "Espresso, steamed oat milk and a drizzle of local honey.",
    price: "$5.25",
    Icon: Coffee,
  },
  {
    name: "Cardamom Morning Bun",
    blurb: "Baked at 6 a.m. and usually gone by 10.",
    price: "$4.00",
    Icon: Croissant,
  },
  {
    name: "Maple Street Cold Brew",
    blurb: "Steeped for 18 hours. Smooth, strong, never bitter.",
    price: "$4.50",
    Icon: CupSoda,
  },
  {
    name: "House Drip",
    blurb: "Our everyday roast, brewed fresh all day long.",
    price: "$3.25",
    Icon: Leaf,
  },
] as const;

/** A believable, completely ordinary neighborhood coffee shop page (fictional). */
export function CoffeeShopSite({ widget }: CoffeeShopSiteProps) {
  return (
    <div className="min-h-screen bg-bean-cream font-site-sans text-bean-brown">
      <header className="border-b border-bean-latte">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="flex items-center gap-2" aria-label="The Daily Bean home">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bean-green text-bean-cream">
              <Coffee className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-site-serif text-xl font-semibold text-bean-green">The Daily Bean</span>
          </a>
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-medium sm:flex">
            <a href="#menu" className="hover:text-bean-green">Menu</a>
            <a href="#story" className="hover:text-bean-green">Our Story</a>
            <a href="#visit" className="hover:text-bean-green">Visit</a>
            <a
              href="#verify"
              className="rounded-full bg-bean-green px-4 py-2 text-bean-cream hover:bg-bean-green-dark"
            >
              Order Ahead
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-bean-clay">
              Neighborhood coffee roasters
            </p>
            <h1 className="font-site-serif text-4xl font-semibold leading-tight text-bean-green sm:text-5xl md:text-6xl">
              A little coffee. A better day.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed">
              Small-batch roasts, warm pastries and a corner table with your name on it. Brewing on
              Maple Street since 2012.
            </p>

            <div id="verify" className="mt-8 max-w-sm scroll-mt-8">
              <p className="mb-2 text-sm font-medium text-bean-green">
                Quick check before you order ahead or view the full menu:
              </p>
              {widget}
            </div>
          </div>

          <HeroIllustration />
        </section>

        <section id="menu" className="bg-bean-latte/60 py-14">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-site-serif text-3xl font-semibold text-bean-green">Today&apos;s favorites</h2>
            <p className="mt-2 max-w-lg">
              A taste of what&apos;s brewing. The full menu is just a quick check away.
            </p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {MENU.map(({ name, blurb, price, Icon }) => (
                <li key={name} className="rounded-2xl border border-bean-latte bg-bean-cream p-5 shadow-sm">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-bean-green/10 text-bean-green">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="font-site-serif text-lg font-semibold text-bean-green">{name}</h3>
                  <p className="mt-1 text-sm leading-relaxed">{blurb}</p>
                  <p className="mt-3 font-semibold text-bean-clay">{price}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="story" className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-2">
          <h2 className="font-site-serif text-3xl font-semibold leading-snug text-bean-green">
            Two friends, one tiny espresso machine.
          </h2>
          <p className="text-lg leading-relaxed">
            The Daily Bean started as a cart on the corner and grew into the shop you see today. We
            roast in small batches, bake every morning and know most of our regulars by their usual
            order. Come in for a cup, stay for the conversation.
          </p>
        </section>

        <section id="visit" className="bg-bean-green py-12 text-bean-cream">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-3">
            <div className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="font-site-serif text-lg font-semibold">Find us</h3>
                <p className="text-sm leading-relaxed text-bean-cream/80">214 Maple Street, on the corner by the bookshop.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="font-site-serif text-lg font-semibold">Hours</h3>
                <p className="text-sm leading-relaxed text-bean-cream/80">Mon to Fri 7am to 6pm. Sat and Sun 8am to 4pm.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShoppingBag className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="font-site-serif text-lg font-semibold">Beans to go</h3>
                <p className="text-sm leading-relaxed text-bean-cream/80">Fresh-roasted bags every Tuesday and Friday. Dogs welcome on the patio.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-5 py-8 text-center text-xs text-bean-brown/70">
        <p>&copy; 2026 The Daily Bean. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-bean-brown/50">
          The Daily Bean is a fictional café created for a game.
        </p>
      </footer>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="mx-auto w-full max-w-md" aria-hidden="true">
      <svg viewBox="0 0 320 320" className="h-auto w-full">
        <circle cx="160" cy="160" r="150" fill="#efe3cf" />
        <circle cx="160" cy="160" r="112" fill="#e4d2b6" />
        {/* steam */}
        <path d="M130 96c-14-16 14-26 0-44" fill="none" stroke="#b85c38" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
        <path d="M162 90c-14-16 14-26 0-44" fill="none" stroke="#b85c38" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
        <path d="M194 96c-14-16 14-26 0-44" fill="none" stroke="#b85c38" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
        {/* saucer and cup */}
        <ellipse cx="160" cy="236" rx="96" ry="18" fill="#163a2b" opacity="0.18" />
        <ellipse cx="160" cy="228" rx="92" ry="16" fill="#fbf6ec" stroke="#1f4d3a" strokeWidth="4" />
        <path d="M82 124h156v52c0 38-30 60-78 60s-78-22-78-60z" fill="#fbf6ec" stroke="#1f4d3a" strokeWidth="5" strokeLinejoin="round" />
        <path d="M238 140h16c18 0 18 40 0 40h-20" fill="none" stroke="#1f4d3a" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="160" cy="126" rx="78" ry="12" fill="#6b4423" />
        <path d="M120 126c14 10 26-6 40 0s26-6 40 0" fill="none" stroke="#e4d2b6" strokeWidth="4" strokeLinecap="round" />
        <path d="M104 190h112" stroke="#1f4d3a" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
        {/* beans */}
        <ellipse cx="62" cy="256" rx="12" ry="8" transform="rotate(-30 62 256)" fill="#4a3220" />
        <ellipse cx="258" cy="266" rx="12" ry="8" transform="rotate(25 258 266)" fill="#4a3220" />
        <ellipse cx="236" cy="276" rx="10" ry="7" transform="rotate(-10 236 276)" fill="#4a3220" />
      </svg>
    </div>
  );
}
