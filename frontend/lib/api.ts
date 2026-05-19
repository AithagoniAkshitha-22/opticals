const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:10000/api"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
      cache: "no-store",
    }
    try {
      const response = await fetch(url, config)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
      return data
    } catch (error) {
      if (error instanceof Error) throw new Error(`API Request Failed: ${error.message}`)
      throw new Error("API Request Failed: Unknown error")
    }
  }

  // ── Patients ──────────────────────────────────────────────
  async getPatients(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return this.request(`/patients${qs ? `?${qs}` : ""}`)
  }

  async getPatientById(id: string) {
    return this.request(`/patients/${id}`)
  }

  async createPatient(data: { name: string; phone: string; age: number; address: string }) {
    return this.request("/patients", { method: "POST", body: JSON.stringify(data) })
  }

  async updatePatient(id: string, data: Partial<{ name: string; phone: string; age: number; address: string }>) {
    return this.request(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }

  async checkReturningPatient(phone: string) {
    return this.request(`/patients/check-returning?phone=${encodeURIComponent(phone)}`)
  }

  async getTodaysPatients() {
    return this.request("/patients/today")
  }

  // ── Prescriptions ─────────────────────────────────────────
  async createPrescription(data: any) {
    return this.request("/prescriptions", { method: "POST", body: JSON.stringify(data) })
  }

  async getPatientPrescriptions(patientId: string) {
    return this.request(`/prescriptions/patient/${patientId}`)
  }

  // ── Orders ────────────────────────────────────────────────
  async getOrders(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return this.request(`/orders${qs ? `?${qs}` : ""}`)
  }

  async getOrderById(id: string) {
    return this.request(`/orders/${id}`)
  }

  async createOrder(data: any) {
    return this.request("/orders", { method: "POST", body: JSON.stringify(data) })
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) })
  }

  async logWhatsApp(id: string, sentBy: string) {
    return this.request(`/orders/${id}/whatsapp`, { method: "POST", body: JSON.stringify({ sentBy }) })
  }

  async getDashboardStats() {
    return this.request("/orders/dashboard")
  }

  async getMonthlyReport(year?: number) {
    return this.request(`/orders/report/monthly${year ? `?year=${year}` : ""}`)
  }

  // ── Brands ────────────────────────────────────────────────
  async getBrands(type?: "frame" | "lens") {
    return this.request(`/brands${type ? `?type=${type}` : ""}`)
  }

  async createBrand(data: { name: string; type: "frame" | "lens" }) {
    return this.request("/brands", { method: "POST", body: JSON.stringify(data) })
  }

  async updateBrand(id: string, name: string) {
    return this.request(`/brands/${id}`, { method: "PUT", body: JSON.stringify({ name }) })
  }
}

export const apiClient = new ApiClient()
