import pRetry from 'p-retry'
import { OperationOptions } from 'retry'

/**
 * Retry function with more sensible defaults for e2e test assertions
 *
 * @param fn The async assertion function to retry
 * @param options Option overrides passed to pRetry
 */
/**
 * TODO(beyang): the problem with retry is that it masks the underlying error; should print these...
 */
export const retry = <T>(fn: (attempt: number) => Promise<T>, options: OperationOptions = {}): Promise<T> =>
    pRetry(fn, { factor: 1, ...options })

/**
 * Looks up an environment variable and parses it as a boolean. Throws when not
 * set and no default is provided, or if parsing fails.
 */
export function readEnvBoolean({
    variable: variable,
    defaultValue,
}: {
    variable: string
    defaultValue?: boolean
}): boolean {
    const value = process.env[variable]

    if (!value) {
        if (defaultValue === undefined) {
            throw new Error(`Environment variable ${variable} must be set.`)
        }
        return defaultValue
    }

    try {
        return Boolean(JSON.parse(value))
    } catch (e) {
        throw new Error(`Incorrect environment variable ${variable}=${value}. Must be truthy or not set at all.`)
    }
}

/**
 * Looks up an environment variable. Throws when not set and no default is
 * provided.
 */
export function readEnvString({ variable, defaultValue }: { variable: string; defaultValue?: string }): string {
    const value = process.env[variable]

    if (!value) {
        if (defaultValue === undefined) {
            throw new Error(`Environment variable ${variable} must be set.`)
        }
        return defaultValue
    }
    return value
}
