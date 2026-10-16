import { useEffect } from 'react'
import { EventHero } from './components/EventHero'
import { PrologueSection } from './components/PrologueSection'
import { ImmersiveDinnerSection } from './components/ImmersiveDinnerSection'
import { VendorsSection } from './components/VendorsSection'
import { BenefitsSection } from './components/BenefitsSection'
import { ApplicationSection } from './components/ApplicationSection'
import { FAQSection } from './components/FAQSection'
import { Footer } from './components/Footer'
import { LegalPage } from './components/LegalPage'
import { track } from './lib/analytics'

function LandingPage() {
  useEffect(() => {
    track('page_view', { page: 'landing' })
    // Прямое открытие URL с #application
    if (window.location.hash === '#application') {
      document.getElementById('application')?.scrollIntoView()
    }
  }, [])

  return (
    <>
      <main id="main">
        <EventHero />
        <PrologueSection />
        <ImmersiveDinnerSection />
        <VendorsSection />
        <BenefitsSection />
        <ApplicationSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  )
}

export function App({ path = window.location.pathname }: { path?: string }) {
  const clean = path.replace(/\/+$/, '') || '/'
  if (clean === '/privacy') return <LegalPage kind="privacy" />
  if (clean === '/terms') return <LegalPage kind="terms" />
  if (clean === '/raffle-rules') return <LegalPage kind="raffle" />
  return <LandingPage />
}
