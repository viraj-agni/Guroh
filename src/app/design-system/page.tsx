"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Sparkles, CheckCircle2, ShieldAlert, Award, Play, Flame, Layers } from "lucide-react"

export default function DesignSystemPreviewPage() {
  const [themeMode, setThemeMode] = React.useState<"dark" | "light">("dark")

  const toggleTheme = () => {
    const next = themeMode === "dark" ? "light" : "dark"
    setThemeMode(next)
    if (next === "light") {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    } else {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    }
  }

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${themeMode === "dark" ? "bg-guroh-bg-dark text-guroh-ivory" : "bg-guroh-bg-light text-[#180608]"}`}>
      {/* Header Banner */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-white/10 dark:border-white/10 light:border-black/10">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-guroh-primary text-guroh-ivory font-bold text-xl shadow-lg">G</span>
            <h1 className="text-3xl font-extrabold tracking-tight">Guroh Design System (DESIGN.md)</h1>
          </div>
          <p className="text-sm font-medium text-guroh-gold-dark mt-1">
            Operationalized Token & Component Library (Next.js 16 + Tailwind v4 + Base UI)
          </p>
        </div>

        <Button onClick={toggleTheme} variant="secondary" size="default">
          <Sparkles className="size-4" /> Toggle {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
      </header>

      <main className="max-w-6xl mx-auto space-y-12">
        {/* Section 1: Brand Colors & Tokens */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="text-guroh-primary size-5" /> 1. Canonical Color Tokens
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-[#8D1516] text-white shadow-md border border-white/10">
              <div className="font-bold text-sm">Deep Oxblood</div>
              <div className="text-xs opacity-80">#8D1516</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#D9A066] text-[#180608] shadow-md border border-black/10">
              <div className="font-bold text-sm">Academic Gold</div>
              <div className="text-xs opacity-80">#D9A066</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#2D6A4F] text-white shadow-md border border-white/10">
              <div className="font-bold text-sm">Sage Emerald</div>
              <div className="text-xs opacity-80">#2D6A4F</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#2A52BE] text-white shadow-md border border-white/10">
              <div className="font-bold text-sm">Oxford Blue</div>
              <div className="text-xs opacity-80">#2A52BE</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F9F1EC] text-[#180608] shadow-md border border-black/10">
              <div className="font-bold text-sm">Parchment Ivory</div>
              <div className="text-xs opacity-80">#F9F1EC</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0F0505] text-white shadow-md border border-white/20">
              <div className="font-bold text-sm">Dark Canvas</div>
              <div className="text-xs opacity-80">#0F0505</div>
            </div>
          </div>
        </section>

        {/* Section 2: Buttons & Fitts's Law Targets */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="text-guroh-gold-dark size-5" /> 2. Button Variants & Touch Targets
          </h2>

          <Card>
            <CardHeader>
              <CardTitle>Button Matrix (Fitts's Law Compliant)</CardTitle>
              <CardDescription>
                Primary (`min-h-[48px]`) vs. Early Learner Horizon 1 (`min-h-[52px]` / 5–7yo)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 items-center">
              <Button variant="default" size="default">
                Primary Oxblood (48px)
              </Button>
              <Button variant="secondary" size="default">
                Secondary Gold (48px)
              </Button>
              <Button variant="emerald" size="default">
                Mastery Emerald (48px)
              </Button>
              <Button variant="sapphire" size="default">
                Sapphire Blue (48px)
              </Button>
              <Button variant="outline" size="default">
                Glass Outline
              </Button>

              <div className="w-full border-t border-white/10 my-2" />

              <Button variant="default" size="earlyLearner">
                <Play className="fill-current size-5" /> Early Learner CTA (52px Touch Target)
              </Button>
              <Button variant="secondary" size="earlyLearner">
                <Award className="size-5" /> Horizon 1 Practice
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Section 3: Mastery Cards & BKT Progress State */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="text-guroh-emerald size-5" /> 3. Cards & Bayesian Knowledge Tracing (BKT) State
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Badge variant="mastery"><CheckCircle2 className="size-3.5" /> BKT Mastery: 94%</Badge>
                  <span className="text-xs font-mono text-guroh-gold-dark">STAGE 2 / LAB</span>
                </div>
                <CardTitle className="mt-2">Vector Addition & Parallelogram Law</CardTitle>
                <CardDescription>Interactive 2D Physics Canvas Sandbox</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Intuition to Mastery</span>
                    <span className="text-emerald-400">0.94 P(L)</span>
                  </div>
                  <Progress value={94} variant="mastery" />
                </div>
                <p className="text-sm opacity-90 leading-relaxed">
                  Drag force vectors $\vec&#123;A&#125;$ and $\vec&#123;B&#125;$ to visually construct the resultant vector $\vec&#123;R&#125;$ on the interactive coordinate plane.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="emerald" size="default" className="w-full">
                  Launch Interactive Lab
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Early Learner (Ages 5-7)</Badge>
                  <span className="text-xs font-mono text-guroh-gold-dark">HORIZON 1</span>
                </div>
                <CardTitle className="mt-2">Triangle Angle Sum Intuition</CardTitle>
                <CardDescription>Tear off vertices to form a $180^\circ$ straight line</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Phonics & Geometry Drill</span>
                    <span className="text-guroh-gold-dark">65% Progress</span>
                  </div>
                  <Progress value={65} variant="gold" />
                </div>
                <p className="text-sm opacity-90 leading-relaxed font-phonics">
                  Drag the three colored corners together to see how $\alpha + \beta + \gamma = 180^\circ$.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" size="earlyLearner" className="w-full">
                  Start Drill (52px Touch)
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Section 4: Modal & Diagnostic Prompts */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-guroh-sapphire-dark size-5" /> 4. Diagnostic Feedback Modal
          </h2>

          <Card>
            <CardHeader>
              <CardTitle>Lesson Feedback & Mastery Check Dialog</CardTitle>
              <CardDescription>Modal component with glass backdrop blur and Base UI primitive</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger>
                  <Button variant="sapphire" size="default">
                    Open Diagnostic Feedback Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="text-guroh-gold-dark size-5" /> Diagnostic Check: Vector Dot Product
                    </DialogTitle>
                    <DialogDescription>
                      You correctly derived that $\vec&#123;A&#125; \cdot \vec&#123;B&#125; = 0$ when vectors are perpendicular!
                    </DialogDescription>
                  </DialogHeader>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <div className="text-xs font-mono text-guroh-gold-dark">BKT STATE UPDATE</div>
                    <div className="text-sm font-bold text-emerald-400">Mastery Level Raised: 0.72 ➔ 0.89</div>
                    <Progress value={89} variant="mastery" className="h-2" />
                  </div>

                  <DialogFooter showCloseButton>
                    <Button variant="emerald" size="default">
                      Continue to Next Lab
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
