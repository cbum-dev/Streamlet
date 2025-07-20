import { CtaSection } from '@/components/CTASection'
import { FeaturesSection } from '@/components/FeatureSection'
import { HomepageHero } from '@/components/Hero'
import { HowItWorks } from '@/components/HowItWorks'
import { StatsSection } from '@/components/StatsSection'
import React from 'react'

function page() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomepageHero/>
      <FeaturesSection/>
      <StatsSection/>
      <HowItWorks/>
      <CtaSection/>
    </div>
  )
}

export default page