"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Contact — ${name || "Klover"}`);
    const body = encodeURIComponent(`Nom: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:contact@klover.co?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <label className="font-medium text-sm" htmlFor="name">
          Nom
        </label>
        <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="grid gap-2">
        <label className="font-medium text-sm" htmlFor="email">
          Email
        </label>
        <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div className="grid gap-2">
        <label className="font-medium text-sm" htmlFor="message">
          Message
        </label>
        <Textarea id="message" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} />
      </div>
      <p className="text-muted-foreground text-xs">
        Ce formulaire ouvre votre client email avec le message pré-rempli.
      </p>
      <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">
        Envoyer
      </Button>
    </form>
  );
}
