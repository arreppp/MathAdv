export type RoleName = 'student' | 'teacher' | 'admin'

export interface StudentProfile {
  id: number
  user_id: string
  class_id: number | null
  xp: number
  level: number
}

export interface TeacherProfile {
  id: number
  user_id: string
  school: string | null
  bio: string | null
}

/** Shape returned by the `me()` Postgres RPC - see supabase/migrations. */
export interface User {
  id: string
  name: string
  avatar: string | null
  role: RoleName | null
  student: StudentProfile | null
  teacher: TeacherProfile | null
}
