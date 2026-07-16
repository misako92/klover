"use client";

import * as React from "react";

import { HelpCircle, Mail, MessageCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SupportWidget() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed right-6 bottom-6 z-50" id="support-widget">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-emerald-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-emerald-700"
            aria-label={open ? "Fermer le support" : "Ouvrir le support"}
          >
            {open ? <X className="size-6" /> : <HelpCircle className="size-6" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="glass-panel mr-4 mb-2 w-80 overflow-hidden p-0" side="top" align="end">
          <div className="bg-emerald-600 p-4 text-white">
            <h4 className="font-semibold">Besoin d'aide ?</h4>
            <p className="mt-1 text-emerald-100 text-xs">
              Notre équipe support est disponible pour répondre à vos questions.
            </p>
          </div>
          <div className="grid gap-1 p-2">
            <Button variant="ghost" className="h-auto justify-start gap-3 py-3">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <MessageCircle className="size-5" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Chat en direct</div>
                <div className="text-muted-foreground text-xs">Réponse en &lt; 5 min</div>
              </div>
            </Button>
            <Button variant="ghost" className="h-auto justify-start gap-3 py-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <Mail className="size-5" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Email</div>
                <div className="text-muted-foreground text-xs">support@klover.co</div>
              </div>
            </Button>
            <div className="my-1 h-px bg-border/50" />
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
              Consulter la documentation
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
