/**
 * outrePurchaseOptimizer.ts
 *
 */

import axios, { AxiosInstance } from "axios";
import { v4 as uuidv4 } from "uuid";
import { outreAiParsedResult } from "./outre-ai-engine";

// Overly complex config
interface outrePurchaseOptimizerConfig {
    endpointUrl: string; // e.g. https://api.outre.com/purchase-optimize
    requestTimeoutMs: number;
    concurrencyOverride?: number; // If we want to force concurrency from the client side
    enableCacheInvalidation?: boolean;
    retryCount: number;
    additionalHeaders?: Record<string, string>;
}

interface outrePurchaseOptimizerInternalState {
    client: AxiosInstance;
    config: outrePurchaseOptimizerConfig;
}

// The shape we expect from the backend aggregator
export interface outreOptimizedOffer {
    partnerName: string;
    productName: string;
    price: number;
    shippingCost: number;
    shippingDays: number;
    brand?: string;
    totalCost: number; // e.g. price + shipping
    link: string;
}

export interface outreOptimizationResult {
    bestOffer?: outreOptimizedOffer;
    offers: outreOptimizedOffer[];
}

export class outrePurchaseOptimizer {
    private state: outrePurchaseOptimizerInternalState;

    constructor(config?: Partial<outrePurchaseOptimizerConfig>) {
        const finalConfig: outrePurchaseOptimizerConfig = {
            endpointUrl:
                config?.endpointUrl ?? "https://api.outre.com/purchase-optimize",
            requestTimeoutMs: config?.requestTimeoutMs ?? 7000,
            concurrencyOverride: config?.concurrencyOverride ?? undefined,
            enableCacheInvalidation: config?.enableCacheInvalidation ?? false,
            retryCount: config?.retryCount ?? 2,
            additionalHeaders: config?.additionalHeaders ?? {},
        };

        const client = axios.create({
            baseURL: finalConfig.endpointUrl,
            timeout: finalConfig.requestTimeoutMs,
            headers: {
                "X-Requested-With": "outrePurchaseOptimizer",
                ...finalConfig.additionalHeaders,
            },
        });

        // Overengineer interceptors for demonstration
        client.interceptors.request.use((req) => {
            console.log("[outrePurchaseOptimizer] Request:", req);
            return req;
        });
        client.interceptors.response.use(
            (res) => {
                console.log("[outrePurchaseOptimizer] Response:", res.status, res.data);
                return res;
            },
            (error) => {
                console.error("[outrePurchaseOptimizer] Error:", error.message);
                throw error;
            }
        );

        this.state = {
            config: finalConfig,
            client,
        };
    }

    /**
     * optimizePurchase
     *
     * Calls to optimize the user’s purchase,
     * passing in the AI parse result plus optional overrides.
     */
    public async optimizePurchase(
        aiParsed: outreAiParsedResult,
        userId?: string
    ): Promise<outreOptimizationResult> {
        const correlationId = uuidv4();
        let attempts = 0;
        let lastError: any;

        while (attempts < this.state.config.retryCount) {
            try {
                const response = await this.state.client.post("/", {
                    correlationId,
                    userId,
                    payload: {
                        aiParsed, // the structured info from outreAiEngine
                        concurrency: this.state.config.concurrencyOverride,
                        cacheInvalidation: this.state.config.enableCacheInvalidation,
                    },
                });

                // Expecting the backend to return something like:
                // {
                //   bestOffer: { partnerName, productName, ... },
                //   offers: [...]
                // }
                return response.data as outreOptimizationResult;
            } catch (err) {
                attempts++;
                lastError = err;
                console.warn(
                    `[outrePurchaseOptimizer] Attempt ${attempts} failed for optimizePurchase: ${err.message}`
                );
            }
        }

        throw new Error(
            `[outrePurchaseOptimizer] optimizePurchase failed after ${this.state.config.retryCount} attempts. Last error: ${lastError?.message
            }`
        );
    }

    /**
     * forceCacheInvalidation
     */
    public async forceCacheInvalidation(reason: string) {
        if (!this.state.config.enableCacheInvalidation) {
            console.log(
                "[outrePurchaseOptimizer] Cache invalidation is disabled in config."
            );
            return;
        }

        try {
            const response = await this.state.client.delete("/cache", {
                data: { reason },
            });
            console.log("[outrePurchaseOptimizer] Cache invalidation response:", response.data);
        } catch (err) {
            console.error("[outrePurchaseOptimizer] Could not invalidate cache:", err);
            // maybe re-throw or handle
        }
    }
}
