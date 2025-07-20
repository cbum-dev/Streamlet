"use client"

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export function CtaSection() {
  return (
    <section className="py-20  bg-gradient-to-b from-primary/5 to-background">
      <div className="container text-center mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Streaming?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of creators broadcasting with Streamlet Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 cursor-pointer py-6 text-lg">
              Get Started For Free
            </Button>
            <Button variant="outline" size="lg" className="px-8 cursor-pointer py-6 text-lg">
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}