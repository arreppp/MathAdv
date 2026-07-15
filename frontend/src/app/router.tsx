import { Route, Routes } from 'react-router-dom'
import { AchievementsPage } from '@/features/achievements/pages/AchievementsPage'
import { AdminPage } from '@/features/admin/pages/AdminPage'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { GamePage } from '@/features/game/pages/GamePage'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { LeaderboardPage } from '@/features/leaderboard/pages/LeaderboardPage'
import { RewardsPage } from '@/features/rewards/pages/RewardsPage'
import { ClassesPage } from '@/features/teacher/pages/ClassesPage'
import { TeacherDashboardPage } from '@/features/teacher/pages/TeacherDashboardPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/play"
        element={
          <ProtectedRoute requireRole="student">
            <GamePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute requireRole="student">
            <AchievementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rewards"
        element={
          <ProtectedRoute requireRole="student">
            <RewardsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute requireRole="teacher">
            <TeacherDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classes"
        element={
          <ProtectedRoute requireRole="teacher">
            <ClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireRole="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
