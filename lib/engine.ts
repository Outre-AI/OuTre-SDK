/**
 * outreAiEngine.ts
 *
 */

import axios, { AxiosInstance } from "axios";
import { v4 as uuidv4 } from "uuid";

// Overly complex config
interface outreAiEngineConfig {
    endpointUrl: string; // e.g. https://api.outre.com/ai-parse
    requestTimeoutMs: number;
    defaultLanguage: string;
    retryCount: number;
    additionalHeaders?: Record<string, string>;
}

interface outreAiEngineInternalState {
    client: AxiosInstance;
    config: outreAiEngineConfig;
}

export interface outreAiParsedResult {
    category: string;          // e.g. "laptop"
    brand?: string;            // e.g. "Dell"
    maxBudget?: number;        // e.g. 1500
    shippingUrgency?: string;  // e.g. "standard" or "expedited"
    // ...
}

export class outreAiEngine {
    private state: outreAiEngineInternalState;

    constructor(config?: Partial<outreAiEngineConfig>) {
        // Merge defaults
        const finalConfig: outreAiEngineConfig = {
            endpointUrl: config?.endpointUrl ?? "https://api.outre.com/ai-parse",
            requestTimeoutMs: config?.requestTimeoutMs ?? 5000,
            defaultLanguage: config?.defaultLanguage ?? "en",
            retryCount: config?.retryCount ?? 2,
            additionalHeaders: config?.additionalHeaders ?? {},
        };

        // Create an Axios instance with overengineered interceptors
        const client = axios.create({
            baseURL: finalConfig.endpointUrl,
            timeout: finalConfig.requestTimeoutMs,
            headers: {
                "X-Requested-With": "outreAiEngine",
                ...finalConfig.additionalHeaders,
            },
        });

        // Interceptor for logging
        client.interceptors.request.use((req) => {
            console.log("[outreAiEngine] Request:", req);
            return req;
        });
        client.interceptors.response.use(
            (res) => {
                console.log("[outreAiEngine] Response:", res.status, res.data);
                return res;
            },
            (error) => {
                console.error("[outreAiEngine] Error:", error.message);
                throw error;
            }
        );

        this.state = {
            config: finalConfig,
            client,
        };
    }

    /**
     * parseUserQuery
     *
     * Overly complicated method that calls the backend's /parse endpoint,
     * possibly reattempting on failure. We also generate a correlation ID for logging.
     */
    public async parseUserQuery(
        userQuery: string,
        preferredLanguage?: string
    ): Promise<outreAiParsedResult> {
        const correlationId = uuidv4();
        const language = preferredLanguage || this.state.config.defaultLanguage;

        let attempts = 0;
        let lastError: any;

        while (attempts < this.state.config.retryCount) {
            try {
                const response = await this.state.client.post("/", {
                    correlationId,
                    userQuery,
                    language,
                });
                // Expecting the backend to return a structure like:
                // { category: ..., brand: ..., maxBudget: ..., shippingUrgency: ... }
                return response.data as outreAiParsedResult;
            } catch (err) {
                attempts++;
                lastError = err;
                console.warn(
                    `[outreAiEngine] Attempt ${attempts} failed for parseUserQuery: ${err.message}`
                );
            }
        }

        // If we exhaust retries:
        throw new Error(
            `[outreAiEngine] parseUserQuery failed after ${this.state.config.retryCount} attempts. Last error: ${lastError?.message
            }`
        );
    }
}
