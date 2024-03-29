/* eslint-disable unicorn/filename-case */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { URLSearchParams } from "url";

/**
 * Options for 'ApiClient' class.
 */
export interface IApiClientOptions {
    /**
     * Auth options.
     */
    auth: {
        /**
         * The client ID.
         */
        clientId: string;
        /**
         * The client secret.
         */
        clientSecret: string;
    };
    /**
     * Custom options for the internal axios instance.
     */
    axiosOptions?: AxiosRequestConfig<any> | null;
    /**
     * The base URL.
     */
    baseURL: string;
    /**
     * The custom oAuth path. Default: '/auth/v1/oauth2/token'
     */
    oAuthPath?: string | null;
    /**
     * A custom path prefix.
     */
    pathPrefix?: string | null;
    /**
     * Additional / custom request headers.
     */
    headers?: any | null;
    /**
     * The default language, like 'de' or 'en'.
     */
    language?: string | null;
}

/**
 * An action for 'withClient()' method of 'ApiClient' class.
 *
 * @param {AxiosInstance} client The client instance.
 *
 * @returns {Promise<TResult>} The promise with the result of the action.
 */
export type WithApiClientAction<TResult extends any = any> =
    (client: AxiosInstance) => Promise<TResult>;

/**
 * Default OAuth path.
 */
export const defaultOAuthPath = "/auth/v1/oauth2/token";

/**
* A generic API client.
*/
export class ApiClient {
    private client: AxiosInstance | undefined;

    /**
     * Initializes a new instance of that class.
     *
     * @param {IApiClientOptions} options Custom options.
     */
    public constructor(
        public readonly options: IApiClientOptions
    ) { }

    private async createNewClient(): Promise<AxiosInstance> {
        const oAuthParams = new URLSearchParams();
        oAuthParams.set("grant_type", "client_credentials");
        oAuthParams.set("client_id", this.options.auth.clientId);
        oAuthParams.set("client_secret", this.options.auth.clientSecret);

        const oAuthClient = axios.create({
            "baseURL": this.options.baseURL,
            "validateStatus": () => {
                return true;
            }
        });

        const oAuthResponse = await oAuthClient.post<any>(
            this.options.oAuthPath || defaultOAuthPath,
            oAuthParams.toString()
        );

        if (oAuthResponse.status !== 200) {
            if (oAuthResponse.status === 400) {
                throw new Error(`Invalid request: ${JSON.stringify(oAuthResponse.data)}`);
            }

            throw new Error(`Unexpected response: ${oAuthResponse.status}`);
        }

        if (typeof oAuthResponse.data !== "object") {
            throw new TypeError(`Unexpected response data: ${oAuthResponse.data}`);
        }

        const accessToken = oAuthResponse.data.access_token;
        if (typeof accessToken !== "string") {
            throw new TypeError(`Unexpected type of access_token: ${accessToken}`);
        }

        const headers: any = {
            "Authorization": `Bearer ${accessToken}`
        };

        if (this.options.language?.length) {
            headers["Accept-Language"] = this.options.language;
        }

        let pathPrefix: string = this.options.pathPrefix || "";
        while (pathPrefix.startsWith("/")) {  // remove leading /
            pathPrefix = pathPrefix.substring(1);
        }
        while (pathPrefix.endsWith("/")) {  // remove ending /
            pathPrefix = pathPrefix.substring(0, pathPrefix.length - 1);
        }

        let baseURL = this.options.baseURL;
        if (!baseURL.endsWith("/")) {
            baseURL += "/";
        }

        const clientOptions: AxiosRequestConfig<any> = {
            // default settings
            "baseURL": baseURL + pathPrefix,
            "headers": {
                ...headers,
                ...(this.options.headers || {})
            },
            "validateStatus": (code) => {
                return code !== 401;
            },

            // the custom stuff
            ...(this.options.axiosOptions || {})
        };

        return axios.create(clientOptions);
    }

    /**
     * Gets a pre-defined client, that is already authenticated.
     *
     * @example
     * ```
     * import ApiClient from '@egomobile/api-client'
     *
     * // setup a client with the following base URL:
     * //
     * // https://api.example.com/my-service/v1
     * const api = new ApiClient({
     *   auth: {
     *     clientId: 'my-client-id',
     *     clientSecret: 'my-client-secret'
     *   },
     *   baseURL: 'https://api.example.com/'
     * })
     *
     * // get an Axios instance, with is already authenticated
     * const client = await api.getClient()
     *
     * // do a GET request on https://api.example.com/my-service/v1/foo
     * const getResponse = await client.get('/foo')
     *
     * // do a POST request on https://api.example.com/my-service/v1/bar
     * const postResponse = await client.post('/bar', {
     *   baz: 42
     * })
     *
     * // do a DELETE request on https://api.example.com/my-service/v1/baz-resource/42
     * const deleteResponse = await client.delete("/baz-resource/42")
     * ```
     *
     * @returns {Promise<AxiosInstance>} The promise with the client instance.
     */
    public getClient(): Promise<AxiosInstance> {
        return this.withClient(async (client) => {
            return client;
        });
    }

    /**
     * Invokes an action, which can use a pre-defined client.
     *
     * @example
     * ```
     * import ApiClient from '@egomobile/api-client'
     *
     * // setup a client with the following base URL:
     * //
     * // https://api.example.com/my-service/v1
     * const apiClient = new ApiClient({
     *   auth: {
     *     clientId: 'my-client-id',
     *     clientSecret: 'my-client-secret'
     *   },
     *   baseURL: 'https://api.example.com/'
     * })
     *
     * // do a GET request on https://api.example.com/my-service/v1/foo
     * const getResponse = await apiClient.withClient(async (client) => {
     *   return await client.get('/foo')
     * })
     *
     * // do a POST request on https://api.example.com/my-service/v1/bar
     * const postResponse = await apiClient.withClient(async (client) => {
     *   return await client.post('/bar', {
     *     baz: 42
     *   })
     * })
     *
     * // do a DELETE request on https://api.example.com/my-service/v1/baz-resource/42
     * const deleteResponse = await apiClient.withClient(async (client) => {
     *   return await client.delete("/baz-resource/42")
     * })
     * ```
     *
     * @param {WithApiClientAction<TResult>} action The action to invoke.
     *
     * @returns {Promise<TResult>} The promise with the result of action.
     */
    public async withClient<TResult extends any = any>(
        action: WithApiClientAction<TResult>
    ): Promise<TResult> {
        let shouldRetry = true;

        let client = this.client;

        const updateWithNewClient = async () => {
            this.client = client = await this.createNewClient();
        };

        if (!client) {
            shouldRetry = false;

            await updateWithNewClient();
        }

        const invokeAction = () => {
            return action(client!);
        };

        try {
            return await invokeAction();
        }
        catch (error: any) {
            // rethrow error by default
            let next: (() => Promise<any>) = async () => {
                throw error;
            };

            if (shouldRetry) {
                if (error?.isAxiosError === true) {
                    if (error?.response?.status === 401) {
                        // retry, because we seem to have
                        // no valid token anymore here

                        next = async () => {
                            await updateWithNewClient();

                            return invokeAction();
                        };
                    }
                }
            }

            return await next();
        }
    }
}

export default ApiClient;
