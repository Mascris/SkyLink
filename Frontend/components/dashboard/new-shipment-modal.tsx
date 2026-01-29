"use client";


import { useState } from "react";
import { createShipment } from "@/lib/api";
import {
  X,
  Package,
  MapPin,
  Truck,
  Ship,
  Plane,
  Train,
  Calendar,
  Weight,
  Box,
  User,
  Mail,
  Phone,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NewShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShipmentFormData) => void;
}

interface ShipmentFormData {
  origin: string;
  destination: string;
  carrier: string;
  weight: string;
  dimensions: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupDate: string;
  notes: string;
}

const carriers = [
  { id: "sea", label: "Sea Freight", icon: Ship, time: "15-30 days" },
  { id: "air", label: "Air Freight", icon: Plane, time: "3-5 days" },
  { id: "road", label: "Road Freight", icon: Truck, time: "5-10 days" },
  { id: "rail", label: "Rail Freight", icon: Train, time: "7-14 days" },
];

const steps = ["Route", "Cargo", "Customer", "Review"];

export function NewShipmentModal({ isOpen, onClose, onSubmit }: NewShipmentModalProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ShipmentFormData>({
    origin: "",
    destination: "",
    carrier: "sea",
    weight: "",
    dimensions: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    pickupDate: "",
    notes: "",
  });

  const handleSubmit = async () => {
    try {
      await createShipment({
        label: `SHP-${Date.now()}`, // Generate a label
        currentHub: formData.origin,
        destinationHub: formData.destination,
        status: "pending",
        progressPercent: 0,
        currentLat: 0, // Default
        currentLng: 0, // Default
        routePathJson: "[]",
      });
      onSubmit(formData);
      setFormData({
        origin: "",
        destination: "",
        carrier: "sea",
        weight: "",
        dimensions: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        pickupDate: "",
        notes: "",
      });
      setStep(0);
    } catch (error) {
      console.error("Failed to create shipment", error);
      // Ideally show a toast here, but for now just log it
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.origin && formData.destination && formData.carrier;
      case 1:
        return formData.weight && formData.pickupDate;
      case 2:
        return formData.customerName && formData.customerEmail;
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Create New Shipment</h2>
              <p className="text-sm text-muted-foreground">Step {step + 1} of {steps.length}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-secondary/30">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium hidden sm:block",
                    i <= step ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-0.5 w-8 sm:w-16 transition-colors",
                    i < step ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="p-6 min-h-[320px]">
          {step === 0 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Origin
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="e.g., Shanghai, China"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="e.g., Los Angeles, USA"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">
                  Shipping Method
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {carriers.map((carrier) => {
                    const Icon = carrier.icon;
                    return (
                      <button
                        key={carrier.id}
                        onClick={() => setFormData({ ...formData, carrier: carrier.id })}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-4 text-left transition-all",
                          formData.carrier === carrier.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full",
                            formData.carrier === carrier.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{carrier.label}</p>
                          <p className="text-sm text-muted-foreground">{carrier.time}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Weight (kg)
                  </label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Dimensions (LxWxH cm)
                  </label>
                  <div className="relative">
                    <Box className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="e.g., 120x80x100"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Pickup Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={formData.pickupDate}
                    onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Special Instructions
                </label>
                <textarea
                  placeholder="Any special handling requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-input px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Customer Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="e.g., John Smith"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="john@company.com"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Review Shipment Details</h3>

              <div className="rounded-lg border border-border divide-y divide-border">
                <div className="flex items-center justify-between p-4">
                  <span className="text-muted-foreground">Route</span>
                  <span className="font-medium text-foreground">
                    {formData.origin} → {formData.destination}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-muted-foreground">Shipping Method</span>
                  <span className="font-medium text-foreground capitalize">
                    {carriers.find((c) => c.id === formData.carrier)?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium text-foreground">{formData.weight} kg</span>
                </div>
                {formData.dimensions && (
                  <div className="flex items-center justify-between p-4">
                    <span className="text-muted-foreground">Dimensions</span>
                    <span className="font-medium text-foreground">{formData.dimensions} cm</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-4">
                  <span className="text-muted-foreground">Pickup Date</span>
                  <span className="font-medium text-foreground">{formData.pickupDate}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium text-foreground">{formData.customerName}</span>
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm text-primary">
                  Estimated delivery: {carriers.find((c) => c.id === formData.carrier)?.time}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              <Check className="mr-2 h-4 w-4" />
              Create Shipment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
