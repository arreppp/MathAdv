export type RoleName = 'student' | 'teacher' | 'admin'

export interface Role {
  id: number
  name: RoleName
}

export interface StudentProfile {
  id: number
  user_id: number
  class_id: number | null
  xp: number
  level: number
}

export interface TeacherProfile {
  id: number
  user_id: number
}

export interface User {
  id: number
  name: string
  email: string
  avatar: string | null
  role: Role | null
  student: StudentProfile | null
  teacher: TeacherProfile | null
}
