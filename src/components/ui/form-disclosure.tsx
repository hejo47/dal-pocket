"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible } from "radix-ui";

import { Button } from "@/components/ui/button";

export function FormDisclosure({ label, defaultOpen = false, children }: { label: string; defaultOpen?: boolean; children: ReactNode }) {
  return <Collapsible.Root defaultOpen={defaultOpen} className="flex flex-col gap-2">
    <Collapsible.Trigger asChild>
      <Button variant="soft" size="sm" className="group self-start">
        {label}<ChevronDown aria-hidden="true" size={16} className="transition-transform group-data-[state=open]:rotate-180" />
      </Button>
    </Collapsible.Trigger>
    <Collapsible.Content className="flex flex-col gap-2">{children}</Collapsible.Content>
  </Collapsible.Root>;
}
