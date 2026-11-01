import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

class HttpClient {
    private axiosInstance: AxiosInstance;

    constructor(baseURL: string, timeout?: number, headers?: Record<string, string>) {
        this.axiosInstance = axios.create({
            baseURL,
            timeout,
            headers
        });
    }
      async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> =
      await this.axiosInstance.get(url, config);

    return response.data;
  }
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> =
      await this.axiosInstance.post(url, data, config);

    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> =
      await this.axiosInstance.put(url, data, config);

    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> =
      await this.axiosInstance.delete(url, config);

    return response.data;
  }
}
const httpClient = new HttpClient('/api', 5000, {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

export default httpClient;