// This file is part of the @egomobile/api-client distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/api-client is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/api-client is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { ApiClient, IApiClientOptions } from '../classes';

/**
 * Options for 'createServiceClient()' function.
 */
export interface ICreateServiceClientOptions {
    /**
     * Options for the 'ApiClient' instance.
     */
    clientOptions: IApiClientOptions;
    /**
     * The name of the service.
     */
    service: string;
    /**
     * The custom version. Default: 'v1'
     */
    version?: string | null;
}

/**
 * The default version of a service.
 */
export const defaultServiceVersion = 'v1';

/**
 * Creates a new API client instance, only for a specific service.
 *
 * @example
 * ```
 * import { createServiceClient } from '@egomobile/api-client'
 *
 * // setup a client with the following base URL:
 * //
 * // https://api.example.com/my-service/v2
 * const apiClient = createServiceClient({
 *   clientOptions: {
 *     // do a client_credentials oAuth flow
 *     auth: {
 *       clientId: 'my-client-id',
 *       clientSecret: 'my-client-secret'
 *     },
 *     baseURL: 'https://api.example.com/'
 *   },
 *   service: 'my-service',
 *   version: 'v2'  // this is optional and 'v1' by default
 * })
 *
 * // setup a BETA client with the following base URL:
 * //
 * // https://api.example.com/my-2nd-service/beta
 * const betaApiClient = createServiceClient({
 *   clientOptions: {
 *     auth: {
 *       clientId: 'my-client-id-2',
 *       clientSecret: 'my-client-secret-2'
 *     },
 *     baseURL: 'https://api.example.com/'
 *   },
 *   service: 'my-2nd-service',
 *   version: 'beta'
 * })
 *
 * // do a GET request on https://api.example.com/my-service/v2/foo
 * const getResponse = await apiClient.withClient(async (client) => {
 *   return await client.get('/foo')
 * })
 *
 * // do a POST request on https://api.example.com/my-service/v2/bar
 * const postResponse = await apiClient.withClient(async (client) => {
 *   return await client.post('/bar', {
 *     baz: 42
 *   })
 * })
 *
 * // do a DELETE request on https://api.example.com/my-2nd-service/beta/baz-resource/42
 * const deleteResponse = await betaApiClient.withClient(async (client) => {
 *   return await client.delete("/baz-resource/42")
 * })
 * ```
 *
 * @param {ICreateServiceClientOptions} options The options.
 *
 * @returns {ApiClient} The new client instance.
 */
export function createServiceClient(options: ICreateServiceClientOptions): ApiClient {
    const service = options.service;
    if (typeof service !== 'string') {
        throw new TypeError('options.service must be of type string');
    }

    const version = options.version || defaultServiceVersion;
    if (typeof version !== 'string') {
        throw new TypeError('options.version must be of type string');
    }

    const clientOptions = options.clientOptions;
    if (typeof clientOptions !== 'object') {
        throw new TypeError('options.clientOptions must be of type object');
    }

    let baseURL = options.clientOptions.baseURL;
    if (typeof baseURL !== 'string') {
        throw new TypeError('options.clientOptions.baseURL must be of type string');
    }

    let pathPrefix = options.clientOptions.pathPrefix;
    if (pathPrefix) {
        if (typeof pathPrefix !== 'string') {
            throw new TypeError('options.clientOptions.pathPrefix must be of type string');
        }
    }

    return new ApiClient({
        ...clientOptions,

        baseURL,
        pathPrefix
    });
}
