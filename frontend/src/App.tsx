import type React from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import HomePage from "./components/HomePage"
import HomeTest from "./components/HomeTest"
import Profile from "./components/Profile"
import EditProfile from "./components/EditProfile"
import UploadPage from "./components/upload/UploadPage"
import TokensPage from "./components/TokensPage"
import VideoPage from "./components/VideoPage"
import axios from "axios"
import { Toaster } from "./components/ui/toaster"
import SearchPage from "./components/SearchPage"

// Set default axios configuration
axios.defaults.withCredentials = true
axios.defaults.baseURL = "http://localhost:5000" // Adjust this if your backend URL is different

// ProtectedRoute component to handle authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-zinc-900 text-white">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/test" element={<HomeTest />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tokens"
              element={
                <ProtectedRoute>
                  <TokensPage />
                </ProtectedRoute>
              }
            />
            <Route path="/video/:id" element={<VideoPage />} />
            <Route path="/search" element={<SearchPage />} />
            {/* Add a catch-all route for 404 pages */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
      <Toaster />
    </AuthProvider>
  )
}

export default App








































