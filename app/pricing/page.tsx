'use client';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20 px-6">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Pricing Plans
        </h1>
        <p className="text-slate-600 mt-4">Choose the plan that fits your learning journey</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Free</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Basic features for trying things out:
              5 summaries per day, 1 video per summary, and 1 hour of audio per summary.
            </p>
            <Button variant="outline" onClick={()=> window.location.href="/.."}>Get Started</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-purple-500">
          <CardHeader>
            <CardTitle>Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Full access with unlimited summaries.</p>
            {/* Lemon Squeezy checkout link */}
            <Button
              onClick={() => {
                window.location.href = "https://your-lemon-squeezy-checkout-link.com";
              }}
              className="bg-purple-600 text-white"
            >
              Upgrade
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Enterprise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Team and org-level solutions.</p>
            <Button asChild>
  <a
    href="https://mail.google.com/mail/?view=cm&fs=1&to=vireon.fusion@gmail.com"
    target="_blank"
    rel="noopener noreferrer"
  >
    Contact Us
  </a>
</Button>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
