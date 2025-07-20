"use client"

import { RadioTower, Radio, MonitorSmartphone, Settings2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

const features = [
  {
    icon: <Radio className="h-8 w-8 text-primary" />,
    title: "Multi-Platform Streaming",
    description: "Simultaneously Radio to YouTube, Twitch, and custom RTMP endpoints with a single click."
  },
  {
    icon: <MonitorSmartphone className="h-8 w-8 text-primary" />,
    title: "Screen & Camera Mixing",
    description: "Professional picture-in-picture layouts with customizable positioning and sizing."
  },
  {
    icon: <RadioTower className="h-8 w-8 text-primary" />,
    title: "Ultra-Low Latency",
    description: "Sub-second streaming latency using WebRTC technology for real-time interaction."
  },
  {
    icon: <Settings2 className="h-8 w-8 text-primary" />,
    title: "Advanced Controls",
    description: "Fine-tune bitrate, resolution, and encoding settings for optimal quality."
  }
]

export function FeaturesSection() {
  return (
    <section className="py-20 container mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Streaming Tools</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Everything you need to Radio like the pros, all in one intuitive interface
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {feature.icon}
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}