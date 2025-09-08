"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.logged_in) setUser({ email: data.email });
      })
      .catch(() => {});
  }, []);

  return (
    <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
          <Youtube className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          NoteAI
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() =>
            document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Features
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/pricing")}>
          Pricing
        </Button>

        
      </div>
    </nav>
  );
}
