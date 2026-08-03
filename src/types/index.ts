// App-specific types (prefixed with 'App' to avoid conflicts with Supabase types)
export type AppUser = {
  id: string;
  email?: string | null;
  created_at: string;
  updated_at?: string;
};

export type AppProfile = {
  id: string;
  user_id: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  school_id: string;
  unit_kerja?: string | null;
  nip?: string | null;
  jabatan?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
};

export type AppSchool = {
  id: string;
  name: string;
  address?: string | null;
  headmaster_name?: string | null;
  headmaster_nip?: string | null;
  headmaster_pangkat?: string | null;
  headmaster_jabatan?: string | null;
  created_at: string;
  updated_at?: string;
};

export type AppCategory = {
  id: number;
  name: string;
  rhk_label: string;
  is_teaching: boolean;
  user_id?: string | null;
  school_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AppClassRoom = {
  id: number;
  name: string;
  user_id?: string | null;
  school_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AppImplementationBase = {
  id: number;
  name: string;
  user_id?: string | null;
  school_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AppActivity = {
  id: string;
  user_id: string;
  school_id: string;
  category_id: string;
  implementation_basis_id?: string | null;
  activity_date: string;
  description: string;
  evidence_link?: string | null;
  teaching_hours?: number | string | null;
  topic?: string | null;
  learning_material?: string | null;
  learning_outcome?: string | null;
  student_outcome?: string | null;
  student_count?: number | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  category?: {
    name: string;
    rhk_label: string;
    is_teaching: boolean;
  } | null;
  basis?: {
    name: string;
  } | null;
  classes?: Array<{
    class: {
      id: number;
      name: string;
    } | null;
  }> | null;
};

export type AppActivityClassRoom = {
  activity_id: string;
  class_room_id: number;
};

export type AppDashboardStats = {
  totalActivities: number;
  teachingActivities: number;
  dailyAverage: number;
  performancePoints: number;
};

export type AppMonthlyStats = {
  counts: number[];
  raw: AppActivity[];
};

export type AppSchedule = {
  id: string;
  user_id: string;
  school_id?: string;
  category_id: number;
  implementation_basis_id?: number | null;
  day_of_week: number;
  topic?: string | null;
  description?: string | null;
  teaching_hours?: string | null;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
  class_room_id?: number; // optional if using pivot
  class_room?: {
    id: number;
    name: string;
  } | null;
  schedule_class_rooms?: Array<{
    class_room_id: number;
    class_rooms: {
      name: string;
    } | null;
  }> | null;
  report_categories?: {
    name: string;
    is_teaching?: boolean;
  } | null;
  created_at?: string;
  updated_at?: string;
};

export type AppHoliday = {
  id: number;
  holiday_date: string;
  name: string;
  description?: string | null;
  is_national: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

// Backward-compatible aliases (use these in your code)
export type User = AppUser;
export type Profile = AppProfile;
export type School = AppSchool;
export type Category = AppCategory;
export type ClassRoom = AppClassRoom;
export type ImplementationBase = AppImplementationBase;
export type Activity = AppActivity;
export type ActivityClassRoom = AppActivityClassRoom;
export type DashboardStats = AppDashboardStats;
export type MonthlyStats = AppMonthlyStats;
export type Schedule = AppSchedule;
export type Holiday = AppHoliday;
