"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { subscribeToNewsletter } from "@/actions/platform-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(107,68,35,0.1),rgba(200,155,109,0.15))]">
      <div className="relative grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-2">
          <p className="text-primary text-sm font-semibold">النشرة البريدية</p>
          <h3 className="text-2xl leading-tight font-bold sm:text-3xl">
            مختارات ثقافية في بريدك
          </h3>
          <p className="text-muted-foreground text-sm leading-7 sm:text-base">
            رسائل موجزة تضم أبرز المقالات والتنبيهات التحريرية.
          </p>
        </div>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await subscribeToNewsletter({ email });
              if (result.success) {
                toast.success(result.message);
                setEmail("");
              } else {
                toast.error(result.message);
              }
            });
          }}
        >
          <Input
            type="email"
            aria-label="البريد الإلكتروني"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 flex-1 rounded-2xl"
          />
          <Button disabled={isPending} className="h-12">
            {isPending ? "جار الاشتراك..." : "اشتراك"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
