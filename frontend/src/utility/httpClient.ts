import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const responseMessage = error.response?.data?.error?.message;
    if (typeof responseMessage === 'string') return responseMessage;
  }
  return error instanceof Error ? error.message : 'Request failed.';
}

class HttpClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string, timeout?: number, headers?: Record<string, string>) {
    this.axiosInstance = axios.create({ baseURL, timeout, headers });
  }

  setAccessToken(token: string | null): void {
    if (token) {
      this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common.Authorization;
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
    return response.data;
  }

  async download(url: string, data?: unknown): Promise<Blob> {
    const response = await this.axiosInstance.post<Blob>(url, data, { responseType: 'blob' });
    return response.data;
  }

  static getErrorMessage(error: unknown): string {
    return getErrorMessage(error);
  }
}

const httpClient = new HttpClient('/api', 5000, {
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

export default httpClient;
