import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { DecksPage } from './pages/DecksPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { TemplateCreatePage } from './pages/TemplateCreatePage'
import { UseSimpleTemplatePage } from './pages/UseSimpleTemplatePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { PresentationPage } from './pages/PresentationPage'
import { GeneratePage } from './pages/GeneratePage'
import { CreatePage } from './pages/CreatePage'
import { BrandKitPage } from './pages/BrandKitPage'
import { CreateFromTemplatePage } from './pages/CreateFromTemplatePage'
import { AuthGuard } from './components/Auth/AuthGuard'
import { ToastProvider } from './components/ui/Toast'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/dashboard"
          element={<AuthGuard><DashboardPage /></AuthGuard>}
        />
        <Route
          path="/decks"
          element={<AuthGuard><DecksPage /></AuthGuard>}
        />
        <Route
          path="/create"
          element={<AuthGuard><CreatePage /></AuthGuard>}
        />
        <Route
          path="/templates"
          element={<AuthGuard><TemplatesPage /></AuthGuard>}
        />
        <Route
          path="/brand-kit"
          element={<AuthGuard><BrandKitPage /></AuthGuard>}
        />
        <Route
          path="/projects"
          element={<AuthGuard><ProjectsPage /></AuthGuard>}
        />
        <Route
          path="/projects/:id"
          element={<AuthGuard><ProjectDetailPage /></AuthGuard>}
        />
        <Route
          path="/templates/new"
          element={<AuthGuard><TemplateCreatePage /></AuthGuard>}
        />
        <Route
          path="/templates/:id/create"
          element={<AuthGuard><CreateFromTemplatePage /></AuthGuard>}
        />
        <Route
          path="/templates/:id/use"
          element={<AuthGuard><UseSimpleTemplatePage /></AuthGuard>}
        />
        <Route
          path="/presentations/:id"
          element={<AuthGuard><PresentationPage /></AuthGuard>}
        />
        <Route
          path="/generate/:jobId"
          element={<AuthGuard><GeneratePage /></AuthGuard>}
        />
        <Route path="/" element={<LandingPage />} />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
