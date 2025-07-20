"use client"

import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

const steps = [
  {
    step: 1,
    title: "Connect Your Accounts",
    description: "Link your streaming platforms in one click with secure OAuth."
  },
  {
    step: 2,
    title: "Configure Your Stream",
    description: "Set resolution, bitrate, and layout preferences."
  },
  {
    step: 3,
    title: "Go Live Instantly",
    description: "Start broadcasting with studio-quality results."
  }
]

export function HowItWorks() {
  return (
    <section className="py-20 container mx-auto">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4">Workflow</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Stream in 3 Simple Steps</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get professional results without the complexity
        </p>
      </div>

      <div className="relative">
        <div className="space-y-12 md:space-y-16 mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="md:flex items-start gap-8">
                <div className="hidden md:flex items-center justify-center rounded-full border w-12 h-12 bg-background shrink-0">
                  <span className="font-bold">{step.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}