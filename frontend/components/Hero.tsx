"use client";

import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { Play, Radio } from "lucide-react";
import { useRouter } from "next/navigation";

export function HomepageHero() {
    const router = useRouter();

    return (
        <AuroraBackground>
            <motion.div
                initial={{ opacity: 0.0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
                className="relative flex flex-col gap-6 items-center justify-center px-4"
            >
                <div className="flex items-center gap-2">
                    <Radio className="h-8 w-8 text-primary" />
                    <span className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400">
                        Streamlet Pro
                    </span>
                </div>

                <div className="text-xl md:text-3xl font-medium text-center text-muted-foreground max-w-2xl">
                    Broadcast like a pro with our next-generation streaming platform
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Button
                        size="lg"
                        className="rounded-full cursor-pointer px-8 py-6 text-lg bg-primary hover:bg-primary/90"
                        onClick={() => router.push("/stream")}
                    >
                        <Play className="mr-1 h-5 w-5" />
                        Go Live Now
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full text-black dark:text-white cursor-pointer px-8 py-6 text-lg border-foreground/20 hover:bg-foreground/5"
                        onClick={() => router.push("/features")}
                    >
                        Explore Features
                    </Button>
                </div>

            </motion.div>
        </AuroraBackground>
    );
}