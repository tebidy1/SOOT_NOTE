export interface Company {
  id: number;
  name: string;
  invitation_code?: string;
  code?: string;
  plan_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  users_count?: number;
  is_active: boolean;
}

export interface CompanySettings {
  groq_api_key?: string;
  gemini_api_key?: string;
  groq_model_pref?: string;
  specialty?: string;
  global_ai_prompt?: string;
  whatsapp_api_key?: string;
  whatsapp_phone_id?: string;
  whatsapp_business_id?: string;
}

export interface Macro {
  id: number;
  trigger: string;
  content: string;
  is_ai_macro: boolean;
  ai_instruction?: string;
  category: string;
}

export interface DashboardStats {
  companies: {
    total: number;
    active: number;
    suspended: number;
    created_today: number;
    created_this_week: number;
    created_this_month: number;
  };
  users: {
    total: number;
    admins: number;
    company_managers: number;
    members: number;
    active: number;
    online: number;
    created_today: number;
    created_this_week: number;
    created_this_month: number;
  };
}
