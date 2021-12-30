export interface DeviceProperties {
  network?: {
    airplaneMode?: boolean;
    locationServices?: boolean;
    wifi?: boolean;
    mobileData?: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}
