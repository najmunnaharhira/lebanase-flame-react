export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface HolidayClosure {
  date: string;
  note: string;
}

export interface BusinessSettings {
  openingHours: OpeningHour[];
  holidayClosures: HolidayClosure[];
}
