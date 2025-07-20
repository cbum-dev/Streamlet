"use client"

import Link from "next/link"
import { 
  Twitter, 
  Youtube, 
  Github, 
  Linkedin,
  Twitch,
  Instagram,
  Radio
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const footerLinks = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Integrations", href: "/integrations" },
      { name: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Documentation", href: "/docs" },
      { name: "Tutorials", href: "/tutorials" },
      { name: "Blog", href: "/blog" },
      { name: "Community", href: "/community" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "Legal", href: "/legal" },
    ],
  },
]

const socialLinks = [
  { icon: <Twitter className="h-4 w-4" />, href: "https://twitter.com" },
  { icon: <Youtube className="h-4 w-4" />, href: "https://youtube.com" },
  { icon: <Twitch className="h-4 w-4" />, href: "https://twitch.tv" },
  { icon: <Github className="h-4 w-4" />, href: "https://github.com" },
  { icon: <Linkedin className="h-4 w-4" />, href: "https://linkedin.com" },
  { icon: <Instagram className="h-4 w-4" />, href: "https://instagram.com" },
]

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Radio className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Streamlet</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Professional streaming tools for creators who demand the best.
            </p>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Stay updated</h4>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-background"
                />
                <Button variant="outline">Subscribe</Button>
              </div>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Streamlet. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {socialLinks.map((social, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  asChild
                >
                  <Link href={social.href} target="_blank" rel="noopener noreferrer">
                    {social.icon}
                  </Link>
                </Button>
              ))}
            </div>

            <div className="flex gap-4 text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/cookies"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}