import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DeliveryShipment {
  id: string;
  status: string;
  carrier_code: string | null;
  tracking_number: string | null;
  last_location_text: string | null;
  last_event_time: string | null;
  created_at: string;
  updated_at: string;
}

interface ShipmentTimelineProps {
  shipment: DeliveryShipment | null;
  isLoading?: boolean;
}

const SHIPMENT_STEPS = [
  { key: 'created', label: 'सिर्जना भयो', icon: Package, description: 'अर्डर सिर्जना गरियो' },
  { key: 'picked_up', label: 'पिकअप भयो', icon: Truck, description: 'विक्रेताबाट उठाइयो' },
  { key: 'in_transit', label: 'ट्रान्जिटमा', icon: ArrowRight, description: 'बाटोमा छ' },
  { key: 'out_for_delivery', label: 'डेलिभरीमा', icon: MapPin, description: 'डेलिभरीका लागि निस्कियो' },
  { key: 'delivered', label: 'डेलिभर भयो', icon: CheckCircle, description: 'सफलतापूर्वक पुर्‍यायो' },
];

const STATUS_STEP_MAP: Record<string, number> = {
  created: 1,
  picked_up: 2,
  in_transit: 3,
  out_for_delivery: 4,
  delivered: 5,
  failed: 0,
};

export function ShipmentTimeline({ shipment, isLoading }: ShipmentTimelineProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shipment) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Truck className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">ट्र्याकिङ जानकारी उपलब्ध छैन</p>
          <p className="text-sm mt-1">डेलिभरी पठाइसकेपछि ट्र्याकिङ देखिनेछ।</p>
        </CardContent>
      </Card>
    );
  }

  const currentStep = STATUS_STEP_MAP[shipment.status] || 0;
  const isFailed = shipment.status === 'failed';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            डेलिभरी ट्र्याकिङ
          </span>
          {shipment.tracking_number && (
            <Badge variant="outline" className="font-mono text-xs">
              #{shipment.tracking_number}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Failed status banner */}
        {isFailed && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 text-destructive rounded-lg">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">डेलिभरी असफल भयो</p>
              {shipment.last_location_text && (
                <p className="text-xs mt-0.5">{shipment.last_location_text}</p>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {SHIPMENT_STEPS.map((step, index) => {
            const Icon = step.icon;
            const stepNumber = index + 1;
            const isCompleted = stepNumber <= currentStep && !isFailed;
            const isCurrent = stepNumber === currentStep && !isFailed;
            const isPending = stepNumber > currentStep;

            return (
              <div key={step.key} className="flex gap-3 relative">
                {/* Connector line */}
                {index < SHIPMENT_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-4 top-8 w-0.5 h-8 -translate-x-1/2",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}

                {/* Icon circle */}
                <div
                  className={cn(
                    "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isPending && "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className={cn(
                  "flex-1 pb-6",
                  isPending && "opacity-50"
                )}>
                  <p className={cn(
                    "font-medium text-sm",
                    isCompleted && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>

                  {/* Show timestamp for current/completed steps */}
                  {isCurrent && shipment.last_event_time && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(shipment.last_event_time), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Last known location */}
        {shipment.last_location_text && !isFailed && (
          <div className="mt-2 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-medium">अन्तिम स्थान:</span>
              {shipment.last_location_text}
            </p>
          </div>
        )}

        {/* Carrier info */}
        {shipment.carrier_code && (
          <p className="text-xs text-muted-foreground mt-2">
            क्यारियर: <span className="font-medium">{shipment.carrier_code}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
