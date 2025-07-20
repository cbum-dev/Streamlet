"use client"

import { Users, Mic2, MonitorUp, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const stats = [
  { value: "400+", label: "Active Streamers", icon: <Users className="h-6 w-6" /> },
  { value: "99.9%", label: "Uptime", icon: <Zap className="h-6 w-6" /> },
  { value: "50ms", label: "Avg Latency", icon: <Mic2 className="h-6 w-6" /> },
  { value: "1080p60", label: "Max Quality", icon: <MonitorUp className="h-6 w-6" /> }
]

export function StatsSection() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container grid grid-cols-2 mx-auto md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center"
          >
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              {stat.icon}
            </div>
            <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
            <p className="text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}