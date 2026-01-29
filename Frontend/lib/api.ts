export interface Shipment {
  shipmentId: string;
  label: string;
  currentHub: string;
  destinationHub: string;
  status: string;
  progressPercent: number;
  currentLat: number;
  currentLng: number;
  routePathJson: string;
  createdAt: string;
}

export interface Hub {
  hubCode: string;
  city: string;
  country: string;
  latitude: number;
  longtitude: number;
  timeZoneOffset: number;
}

export async function fetchActiveShipments(): Promise<Shipment[]> {
  const response = await fetch('/api/shipment/active');
  if (!response.ok) {
    throw new Error('Failed to fetch shipments');
  }
  return response.json();
}

export async function createShipment(shipment: Partial<Shipment>): Promise<Shipment> {
  const response = await fetch('/api/shipment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shipment),
  });
  if (!response.ok) {
    throw new Error('Failed to create shipment');
  }
  return response.json();
}

export async function fetchHubs(): Promise<Hub[]> {
  const response = await fetch('/api/hub/all');
  if (!response.ok) {
    throw new Error('Failed to fetch hubs');
  }
  return response.json();
}
