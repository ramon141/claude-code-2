import axios from "axios";
import type { AxiosResponse, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

type NetworkErrorData = {message: string};

const api = axios.create({
    baseURL: 'http://127.0.0.1:3000'
});

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<NetworkErrorData>) => {
        if (error.code === "ERR_NETWORK") {
            error.response = {
                data: { message: `A API não está respondendo. Certifique-se que ela está aberta no endereço: ${error.config?.baseURL}` },
                status: 0,
                statusText: 'Network Error',
                headers: {},
                config: error.config as InternalAxiosRequestConfig,
            };
        }
        return Promise.reject(error);
    }
);

export const mutator = <T>(config: AxiosRequestConfig): Promise<T> => {
    return api(config).then((response: AxiosResponse<T>) => response.data);
};
