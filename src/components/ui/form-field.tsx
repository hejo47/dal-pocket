import type { ComponentProps } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import { cn } from "@/lib/utils";

export function TextField(props: ComponentProps<typeof Input>) { return <Input {...props} />; }
export { DateField } from "@/components/ui/date-picker";
type Option = { value: string; label: string };
export function SelectField({ options, ...props }: ComponentProps<typeof NativeSelect> & { options: readonly Option[] }) {
  return <NativeSelect {...props}>{options.map((option) => <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>)}</NativeSelect>;
}
export function FieldLabel({ required, children, ...props }: ComponentProps<typeof Label> & { required?: boolean }) {
  return <Label {...props}>{children}{required && <span className="text-xs text-red-2">필수</span>}</Label>;
}
export function FieldHint({ className, ...props }: ComponentProps<"p">) { return <p className={cn("text-xs leading-160 text-black-030", className)} {...props} />; }
export function FieldError({ children, ...props }: ComponentProps<"p">) { return children ? <p role="alert" className="border-l-2 border-black-100 pl-3 text-sm leading-150 text-black-100" {...props}>{children}</p> : null; }
export { Checkbox };
