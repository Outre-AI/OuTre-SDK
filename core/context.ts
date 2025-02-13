/**
 * outre-context.ts
 *
 */

import { AsyncLocalStorage } from "async_hooks";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Shape of data we want to store in our context.
 * Extend or modify as needed. 
 */
export interface outreContextData {
    correlationId: string;
    userId?: string;
    /** More fields possible, e.g. locale, tenantId, etc. */
}

/**
 * A specialized AsyncLocalStorage for our outre context.
 */
const outreContextStore = new AsyncLocalStorage<outreContextData>();

/**
 * Express middleware to initialize outre context. 
 *  - If the request has a correlation ID header, we use that.
 *  - Otherwise, we generate one.
 *  - Optionally, we might also attach a user ID from a JWT or session.
 */
export function outreContextMiddleware(req: Request, _res: Response, next: NextFunction) {
    // Attempt to read an existing correlation ID from headers
    const incomingCorrelationId = req.headers["x-correlation-id"];

    // If it’s not a string, we generate a new UUID
    let correlationId: string;
    if (typeof incomingCorrelationId === "string" && incomingCorrelationId.trim().length > 0) {
        correlationId = incomingCorrelationId.trim();
    } else {
        correlationId = randomUUID();
    }

    // Example: read a user ID from the request (placeholder logic)
    // In real code, you might parse a JWT or session data here.
    const userId = (req as any).userId || undefined;

    // Prepare the context data
    const contextData: outreContextData = {
        correlationId,
        userId
    };

    // Run the rest of the request inside the AsyncLocalStorage context
    outreContextStore.run(contextData, () => {
        next();
    });
}

/**
 * Retrieve the current context. Returns undefined if called outside an async context.
 */
export function getoutreContext(): outreContextData | undefined {
    return outreContextStore.getStore();
}

/**
 * Helper to fetch correlationId from context quickly.
 */
export function getCorrelationId(): string | undefined {
    return outreContextStore.getStore()?.correlationId;
}

/**
 * Helper to fetch userId from context quickly.
 */
export function getUserId(): string | undefined {
    return outreContextStore.getStore()?.userId;
}
