import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateEquipment, useUpdateEquipment, type Equipment } from "@/hooks/useEquipment";
import { Constants } from "@/integrations/supabase/types";
import { toast } from "sonner";

const equipmentTypes = Constants.public.Enums.equipment_type;
const equipmentStatuses = Constants.public.Enums.equipment_status;

const ratingUnits = ["kW", "MW", "kVA", "MVA", "A", "kV", "HP"] as const;

const schema = z.object({
  tag_number: z.string().trim().min(1, "Tag number is required").max(50),
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.enum(equipmentTypes as unknown as [string, ...string[]]),
  status: z.enum(equipmentStatuses as unknown as [string, ...string[]]),
  rating: z.coerce.number().positive().optional().or(z.literal("")),
  rating_unit: z.string().optional(),
  manufacturer: z.string().trim().max(200).optional().or(z.literal("")),
  model: z.string().trim().max(200).optional().or(z.literal("")),
  serial_number: z.string().trim().max(200).optional().or(z.literal("")),
  installation_date: z.string().optional().or(z.literal("")),
  location: z.string().trim().max(500).optional().or(z.literal("")),
  protection_settings: z.string().trim().max(2000).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface EquipmentFormProps {
  equipment?: Equipment | null;
  onSuccess: () => void;
}

export function EquipmentForm({ equipment, onSuccess }: EquipmentFormProps) {
  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();
  const isEditing = !!equipment;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tag_number: equipment?.tag_number ?? "",
      name: equipment?.name ?? "",
      type: equipment?.type ?? "generator",
      status: equipment?.status ?? "offline",
      rating: equipment?.rating ?? ("" as any),
      rating_unit: equipment?.rating_unit ?? "kW",
      manufacturer: equipment?.manufacturer ?? "",
      model: equipment?.model ?? "",
      serial_number: equipment?.serial_number ?? "",
      installation_date: equipment?.installation_date ?? "",
      location: equipment?.location ?? "",
      protection_settings: equipment?.protection_settings ?? "",
      notes: equipment?.notes ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      tag_number: values.tag_number,
      name: values.name,
      type: values.type as any,
      status: values.status as any,
      rating: values.rating ? Number(values.rating) : null,
      rating_unit: values.rating_unit || null,
      manufacturer: values.manufacturer || null,
      model: values.model || null,
      serial_number: values.serial_number || null,
      installation_date: values.installation_date || null,
      location: values.location || null,
      protection_settings: values.protection_settings || null,
      notes: values.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: equipment.id, ...payload },
        {
          onSuccess: () => { toast.success("Equipment updated"); onSuccess(); },
          onError: (err) => toast.error(err.message),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success("Equipment added"); onSuccess(); },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Tag, Name, Type */}
        <div className="grid grid-cols-3 gap-3">
          <FormField control={form.control} name="tag_number" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Tag Number *</FormLabel>
              <FormControl><Input placeholder="GEN-01" className="font-mono text-xs" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Name *</FormLabel>
              <FormControl><Input placeholder="Generator 1" className="font-mono text-xs" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {equipmentTypes.map((t) => (
                    <SelectItem key={t} value={t} className="font-mono text-xs capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Row 2: Status, Rating, Unit */}
        <div className="grid grid-cols-3 gap-3">
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {equipmentStatuses.map((s) => (
                    <SelectItem key={s} value={s} className="font-mono text-xs capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="rating" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Rating</FormLabel>
              <FormControl><Input type="number" step="any" placeholder="60" className="font-mono text-xs" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="rating_unit" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Unit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {ratingUnits.map((u) => (
                    <SelectItem key={u} value={u} className="font-mono text-xs">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Row 3: Manufacturer, Model, Serial */}
        <div className="grid grid-cols-3 gap-3">
          <FormField control={form.control} name="manufacturer" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Manufacturer</FormLabel>
              <FormControl><Input placeholder="Caterpillar" className="font-mono text-xs" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="model" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Model</FormLabel>
              <FormControl><Input placeholder="C32 ACERT" className="font-mono text-xs" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="serial_number" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Serial Number</FormLabel>
              <FormControl><Input placeholder="SN-12345" className="font-mono text-xs" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Row 4: Installation Date, Location */}
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="installation_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Installation Date</FormLabel>
              <FormControl><Input type="date" className="font-mono text-xs" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-mono">Location</FormLabel>
              <FormControl><Input placeholder="Plant Room A, Level 1" className="font-mono text-xs" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Protection Settings */}
        <FormField control={form.control} name="protection_settings" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-mono">Protection Settings</FormLabel>
            <FormControl><Textarea placeholder="Overcurrent relay: 50/51, Earth fault: 51N..." className="font-mono text-xs min-h-[60px]" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Notes */}
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-mono">Notes</FormLabel>
            <FormControl><Textarea placeholder="Additional notes..." className="font-mono text-xs min-h-[60px]" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" size="sm" disabled={isPending} className="font-mono text-xs">
            {isPending ? "Saving..." : isEditing ? "Update" : "Add Equipment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
