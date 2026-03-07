export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  map?: {
    id: string;
    summary_polyline: string;
    polyline?: string;
  };
  timezone?: string;
  trainer?: boolean;
  suffer_score?: number;
  calories?: number;
  gear_id?: string;
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  city: string;
  state: string;
  country: string;
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: StravaAthlete;
}

// Processed data for visualization
export interface DayData {
  date: string; // YYYY-MM-DD
  distance: number; // km
  duration: number; // minutes
  elevation: number; // meters
  pace: number; // min/km
  heartrate?: number;
  count: number; // number of activities
}

export interface YearSummary {
  year: number;
  totalDistance: number; // km
  totalDuration: number; // hours
  totalElevation: number; // meters
  totalActivities: number;
  avgPace: number; // min/km
  longestRun: number; // km
}
