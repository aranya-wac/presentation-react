import axios from 'axios'

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 120000, // 2 min — generation can take 10-30s
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refresh,
          })
          localStorage.setItem('access_token', data.access_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (email: string, password: string, full_name: string) =>
    api.post('/auth/register', { email, password, full_name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, new_password }),
}

// Themes
export const themesApi = {
  list: () => api.get('/themes'),
  get: (id: string) => api.get(`/themes/${id}`),
}

// Templates
export type TemplateLayoutType = 'title' | 'bullets' | 'image' | 'columns'
export type TemplateSlideSource = 'rich' | 'simple'

export interface TemplateSlideInput {
  order: number
  title: string
  layout_type: TemplateLayoutType
  prompt_hint: string
}

export interface TemplateCreatePayload {
  name: string
  description?: string
  category?: string
  tags?: string[]
  role?: string | null
  theme_id: string
  slides: TemplateSlideInput[]
}

export const templatesApi = {
  list: (params?: { source?: 'mine' | 'builtin' | 'all'; category?: string }) =>
    api.get('/templates', { params }),
  get: (id: string) => api.get(`/templates/${id}`),
  preview: (id: string) => api.get(`/templates/${id}/preview`),
  getPreview: (id: string) => api.get(`/templates/${id}/preview`),
  generateFromPrompt: (id: string, prompt: string, title?: string, slide_count?: number) =>
    api.post(`/templates/${id}/generate-from-prompt`, { prompt, title, slide_count }),

  create: (payload: TemplateCreatePayload) => api.post('/templates', payload),
  update: (id: string, payload: Partial<TemplateCreatePayload>) =>
    api.put(`/templates/${id}`, payload),
  delete: (id: string) => api.delete(`/templates/${id}`),
  publish: (id: string, is_published: boolean) =>
    api.post(`/templates/${id}/publish`, { is_published }),
  generateSimple: (id: string, prompt: string, title?: string) =>
    api.post(`/templates/${id}/generate-simple`, { prompt, title }),
}

// Generation
export const generationApi = {
  start: (template_id: string, file: File) => {
    const form = new FormData()
    form.append('template_id', template_id)
    form.append('file', file)
    return api.post('/generate', form)
  },
  status: (job_id: string) => api.get(`/generate/status/${job_id}`),
  generateSync: (
    prompt: string,
    slideCount: number,
    file?: File,
    url?: string,
    images?: File[],
    level?: 'simple' | 'advanced',
  ) => {
    const form = new FormData()
    form.append('prompt', prompt)
    form.append('slide_count', String(slideCount))
    if (file) form.append('file', file)
    if (url) form.append('url', url)
    if (images?.length) {
      for (const img of images) form.append('images', img)
    }
    if (level) form.append('level', level)
    return api.post('/generate/sync', form)
  },
  /** Streaming generation. Returns the underlying Response so the caller can
   *  iterate the SSE event stream. */
  generateStream: (
    prompt: string,
    slideCount: number,
    file?: File,
    url?: string,
    images?: File[],
    level?: 'simple' | 'advanced',
    outline?: Array<{ order: number; type: string; title: string }>,
  ) => {
    const form = new FormData()
    form.append('prompt', prompt)
    form.append('slide_count', String(slideCount))
    if (file) form.append('file', file)
    if (url) form.append('url', url)
    if (images?.length) {
      for (const img of images) form.append('images', img)
    }
    if (level) form.append('level', level)
    if (outline?.length) form.append('outline_json', JSON.stringify(outline))
    const token = localStorage.getItem('access_token')
    return fetch(`${BASE_URL}/api/v1/generate/stream`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
  },
  generateOutline: (
    prompt: string,
    slideCount: number,
    file?: File,
    url?: string,
    images?: File[],
    level?: 'simple' | 'advanced',
  ) => {
    const form = new FormData()
    form.append('prompt', prompt)
    form.append('slide_count', String(slideCount))
    if (file) form.append('file', file)
    if (url) form.append('url', url)
    if (images?.length) {
      for (const img of images) form.append('images', img)
    }
    if (level) form.append('level', level)
    return api.post<{
      deck_title: string
      summary: string
      audience: string
      tone: string
      sections: Array<{ name: string; content: string; slide_count: number }>
      slides: Array<{ order: number; type: string; title: string }>
      token_count: number
    }>('/generate/outline', form)
  },
  regenerateSlide: (payload: {
    original_prompt: string
    level: 'simple' | 'advanced'
    slide_type: string
    slide_title: string
    deck_titles: string[]
    instruction?: string
  }) =>
    api.post<{
      slide: { type: string; background: any; blocks: any[]; notes?: string }
      token_count: number
    }>('/generate/slide', payload),
}

// Image generation
export const imagesApi = {
  generate: (prompt: string, style?: string) =>
    api.post<{ url: string; mime_type: string }>('/images/generate', {
      prompt,
      style: style ?? '',
    }),
  /** Resolve a relative `/generated/...` URL to a fully qualified one. */
  resolveUrl: (url: string) =>
    url.startsWith('http') ? url : `${BASE_URL}${url}`,
}

// Usage (plan + monthly generation count for sidebar meter)
export interface UsageInfo {
  plan: string
  plan_label: string
  generations_used: number
  generations_limit: number | null
  period_start: string
  period_end: string
  upgrade_available: boolean
}

export const usageApi = {
  get: () => api.get<UsageInfo>('/usage'),
}

// Brand kit
export const brandKitApi = {
  get: () => api.get<import('../types').BrandKit>('/brand-kit'),
  update: (payload: Partial<import('../types').BrandKit>) =>
    api.put<import('../types').BrandKit>('/brand-kit', payload),
}

// Versions
export const versionsApi = {
  list: (presentation_id: string) =>
    api.get<import('../types').PresentationVersion[]>(
      `/presentations/${presentation_id}/versions`,
    ),
  create: (presentation_id: string, label: string = '') =>
    api.post<import('../types').PresentationVersion>(
      `/presentations/${presentation_id}/versions`,
      { label },
    ),
  restore: (presentation_id: string, version_id: string) =>
    api.post<import('../types').PresentationDetail>(
      `/presentations/${presentation_id}/versions/${version_id}/restore`,
    ),
}

// Presentations
export const presentationsApi = {
  list: () => api.get('/presentations'),
  get: (id: string) => api.get(`/presentations/${id}`),
  create: (payload: {
    title: string
    description?: string
    slides: object[]
    theme_id: string
    template_id?: string
    token_count?: number
  }) => api.post('/presentations', payload),
  update: (id: string, payload: object) => api.patch(`/presentations/${id}`, payload),
  delete: (id: string) => api.delete(`/presentations/${id}`),
}

// Import
export const importApi = {
  importPptx: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ id: string; title: string; total_slides: number }>('/import/pptx', form)
  },
}

// Export
export const exportApi = {
  start: (presentation_id: string, format: string) =>
    api.post(`/export/${presentation_id}/${format}`),
  status: (job_id: string) => api.get(`/export/jobs/${job_id}`),
  /** Authenticated download — fetches via axios (sends Authorization header) then
   *  triggers a browser save dialog using a temporary blob URL. */
  download: async (job_id: string, filename: string) => {
    const response = await api.get(`/export/download/${job_id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}

// Share — public read-only HTML preview link (no account needed to view)
export const shareApi = {
  url: (presentation_id: string) =>
    `${BASE_URL}/api/v1/share/view/${presentation_id}`,
}

// Projects
export type ProjectRole = 'developer' | 'ba' | 'sales' | 'pm' | 'qa'
export type ProjectStatus = 'active' | 'draft' | 'archived'
export type ExtractionStatus = 'pending' | 'complete' | 'failed'

export interface ProjectListItem {
  id: string
  name: string
  description: string
  status: ProjectStatus
  tags: string[]
  owner_id: string
  document_count: number
  presentation_count: number
  created_at: string
  updated_at: string
}

export interface ProjectDocument {
  id: string
  project_id: string
  filename: string
  original_filename: string
  format: string
  size_bytes: number
  version: number
  extraction_status: ExtractionStatus
  tags: string[]
  uploaded_by: string
  created_at: string
  updated_at: string
}

export interface ProjectPresentationLink {
  id: string
  project_id: string
  presentation_id: string
  role: ProjectRole
  prompt_version: string
  source_document_ids: string[]
  generated_by: string
  title: string
  slide_count: number
  created_at: string
  prior_link_id: string | null
  version: number
}

export interface ProjectDetail extends ProjectListItem {
  documents: ProjectDocument[]
  presentations: ProjectPresentationLink[]
}

export interface ProjectListPage {
  items: ProjectListItem[]
  total: number
  limit: number
  offset: number
}

export interface ProjectActivity {
  id: string
  project_id: string
  actor_id: string | null
  actor_name: string
  action: string
  entity_type: string | null
  entity_id: string | null
  summary: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface ProjectActivityPage {
  items: ProjectActivity[]
  total: number
  limit: number
  offset: number
}

export type ProjectMemberRole = 'owner' | 'editor' | 'viewer'

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  email: string
  full_name: string
  role: ProjectMemberRole
  created_at: string
}

export interface ProjectRoleProfile {
  role: ProjectRole
  audience: string
  focus: string
}

export const projectsApi = {
  list: (params?: { status?: string; search?: string; sort?: string }) =>
    api.get<ProjectListItem[]>('/projects', { params }),
  listPaged: (params?: {
    status?: string
    search?: string
    sort?: string
    limit?: number
    offset?: number
  }) =>
    api.get<ProjectListPage>('/projects', {
      params: { ...params, paginated: true },
    }),
  get: (id: string) => api.get<ProjectDetail>(`/projects/${id}`),
  create: (payload: { name: string; description?: string; tags?: string[]; status?: ProjectStatus }) =>
    api.post<ProjectListItem>('/projects', payload),
  update: (id: string, payload: Partial<Pick<ProjectListItem, 'name' | 'description' | 'tags' | 'status'>>) =>
    api.patch<ProjectListItem>(`/projects/${id}`, payload),
  delete: (id: string) => api.delete(`/projects/${id}`),

  roles: () => api.get<ProjectRoleProfile[]>('/projects/roles'),

  listDocuments: (project_id: string) =>
    api.get<ProjectDocument[]>(`/projects/${project_id}/documents`),
  uploadDocument: (project_id: string, file: File, tags?: string[]) => {
    const form = new FormData()
    form.append('file', file)
    if (tags?.length) form.append('tags', JSON.stringify(tags))
    return api.post<ProjectDocument>(`/projects/${project_id}/documents`, form)
  },
  deleteDocument: (project_id: string, document_id: string) =>
    api.delete(`/projects/${project_id}/documents/${document_id}`),
  retryExtraction: (project_id: string, document_id: string) =>
    api.post<ProjectDocument>(
      `/projects/${project_id}/documents/${document_id}/retry-extraction`,
    ),
  documentStatus: (project_id: string, document_id: string) =>
    api.get<{ id: string; extraction_status: ExtractionStatus; extraction_error: string | null }>(
      `/projects/${project_id}/documents/${document_id}/status`,
    ),
  getDocument: (project_id: string, document_id: string) =>
    api.get<ProjectDocument & { extracted_text: string | null; extraction_error: string | null; storage_path: string }>(
      `/projects/${project_id}/documents/${document_id}`,
    ),
  downloadDocument: async (project_id: string, document_id: string, filename: string) => {
    const response = await api.get(
      `/projects/${project_id}/documents/${document_id}/download`,
      { responseType: 'blob' },
    )
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  generate: (
    project_id: string,
    payload: {
      role: ProjectRole
      document_ids?: string[]
      template_id?: string
      theme_id?: string
      title?: string
    },
  ) => api.post<ProjectPresentationLink>(`/projects/${project_id}/generate`, payload),

  listActivities: (project_id: string, params?: { limit?: number; offset?: number }) =>
    api.get<ProjectActivityPage>(`/projects/${project_id}/activities`, { params }),

  listMembers: (project_id: string) =>
    api.get<ProjectMember[]>(`/projects/${project_id}/members`),
  addMember: (project_id: string, email: string, role: ProjectMemberRole) =>
    api.post<ProjectMember>(`/projects/${project_id}/members`, { email, role }),
  updateMemberRole: (project_id: string, member_id: string, role: ProjectMemberRole) =>
    api.patch<ProjectMember>(`/projects/${project_id}/members/${member_id}`, { role }),
  removeMember: (project_id: string, member_id: string) =>
    api.delete(`/projects/${project_id}/members/${member_id}`),

  deletePresentation: (project_id: string, link_id: string) =>
    api.delete(`/projects/${project_id}/presentations/${link_id}`),
  regeneratePresentation: (
    project_id: string,
    link_id: string,
    payload?: {
      role?: ProjectRole
      document_ids?: string[]
      template_id?: string
      theme_id?: string
      title?: string
    },
  ) =>
    api.post<ProjectPresentationLink>(
      `/projects/${project_id}/presentations/${link_id}/regenerate`,
      payload ?? {},
    ),
}
