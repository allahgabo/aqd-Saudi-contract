import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';
export const api = axios.create({ baseURL: BASE_URL, timeout: 120000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(res => res, async error => {
  if (error.response?.status === 401) {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', res.data.access);
        error.config.headers.Authorization = `Bearer ${res.data.access}`;
        return api.request(error.config);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
  }
  return Promise.reject(error);
});

// ── Types ──────────────────────────────────────────────────────────
export type ContractType = 'employment_contract' | 'offer_letter' | 'addendum' | 'other';
export type OverallRisk  = 'valid' | 'attention' | 'high_risk';
export type Assessment   = 'compliant'|'needs_clarification'|'may_non_compliant'|'missing'|'ambiguous'|'unusual';
export type RiskLevel    = 'low'|'medium'|'high'|'critical';
export type PlanName     = 'free'|'pro'|'enterprise';

export interface Plan {
  name: PlanName;
  display_name: string;
  monthly_limit: number;
  price_sar: number;
  features: string[];
}

export interface UserProfile {
  plan: Plan | null;
  company: string;
  phone: string;
  avatar_color: string;
  is_admin: boolean;
  contracts_this_month: number;
  total_contracts: number;
  remaining_analyses: number;
  can_analyze: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile | null;
}

export interface ClauseAnalysis {
  id: string; category: string; category_display: string;
  clause_title: string; clause_text: string;
  assessment: Assessment; assessment_display: string;
  risk_level: RiskLevel; risk_level_display: string;
  explanation: string; regulatory_reference: string;
  recommendation: string; order: number;
}
export interface MissingClause {
  id: string; clause_name: string;
  importance: 'required'|'recommended'|'optional';
  description: string; regulatory_reference: string;
}
export interface SuggestedQuestion {
  id: string; question: string; related_clause: string; priority: 'high'|'medium'|'low';
}
export interface Contract {
  id: string; file_name: string; file_type: string;
  contract_type: ContractType; contract_type_display: string;
  language: string; status: 'pending'|'processing'|'completed'|'failed';
  overall_risk: OverallRisk; overall_risk_display: string;
  compliance_score: number;
  compliant_count: number; attention_count: number;
  non_compliant_count: number; missing_clauses_count: number;
  employer_name: string; employee_name: string; job_title: string;
  basic_salary: string; gross_salary: string;
  contract_duration: string; probation_period: string;
  work_location: string; start_date: string;
  executive_summary: string;
  clauses: ClauseAnalysis[];
  missing_clauses: MissingClause[];
  suggested_questions: SuggestedQuestion[];
  is_shared: boolean; share_token: string;
  created_at: string; analyzed_at: string;
}
export interface DashboardStats {
  total_contracts: number; valid_contracts: number;
  attention_contracts: number; high_risk_contracts: number;
  average_compliance_score: number;
}
export interface ChatMessage { role:'user'|'assistant'; content:string; timestamp:string; }
export interface AdminUser {
  id: number; username: string; email: string;
  first_name: string; last_name: string;
  date_joined: string; is_active: boolean;
  profile: UserProfile | null;
  contract_count: number;
}

const backendBase = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const authApi = {
  login:   (username: string, password: string) =>
    api.post<{access:string;refresh:string;user:User}>('/auth/token/', {username, password}),
  register:(data: any) =>
    api.post<{access:string;refresh:string;user:User}>('/auth/register/', data),
  profile: () => api.get<User>('/auth/profile/'),
  updateProfile: (data: Partial<{first_name:string;last_name:string;company:string;phone:string}>) =>
    api.patch<User>('/auth/profile/', data),
  logout:  (refresh: string) => api.post('/auth/logout/', {refresh}),
  upgradePlan: (plan: PlanName) => api.post('/auth/upgrade/', {plan}),
};

export const contractsApi = {
  health: () => api.get('/health/'),
  upload: (file: File, contractType: ContractType) => {
    const form = new FormData();
    form.append('file', file);
    form.append('contract_type', contractType);
    return api.post<Contract>('/contracts/upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list:           () => api.get<Contract[]>('/contracts/'),
  get:            (id: string) => api.get<Contract>(`/contracts/${id}/`),
  delete:         (id: string) => api.delete(`/contracts/${id}/delete/`),
  stats:          () => api.get<DashboardStats>('/contracts/stats/'),
  share:          (id: string) => api.post<{share_url:string;share_token:string}>(`/contracts/${id}/share/`),
  chat:           (contractId: string, question: string, history: ChatMessage[]) =>
    api.post<{answer:string}>(`/contracts/${contractId}/chat/`, {question, history}),
  compare:        (id1: string, id2: string) =>
    api.post<{comparison:string}>('/contracts/compare/', {contract1: id1, contract2: id2}),
  downloadReport: (id: string) => window.open(`${backendBase}/reports/${id}/download/`, '_blank'),
};

export const adminApi = {
  users:       () => api.get<AdminUser[]>('/admin/users/'),
  userDetail:  (id: number) => api.get<AdminUser>(`/admin/users/${id}/`),
  updatePlan:  (userId: number, plan: PlanName) => api.post(`/admin/users/${userId}/plan/`, {plan}),
  stats:       () => api.get<any>('/admin/stats/'),
};
