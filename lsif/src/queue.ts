import { Span, Tracer, FORMAT_TEXT_MAP } from 'opentracing'
import { Job, Queue as ResqueQueue, Worker as ResqueWorker, Connection as ResqueConnection } from 'node-resque'
import { Redis } from 'ioredis'

/**
 * The names of jobs performed by the LSIF worker.
 */
export type JobClass = 'convert'

/**
 * This type provides additional methods defined in node-resque but not
 * defined in @types/node-resque.
 */
interface Connection extends ResqueConnection {
    /**
     * The underlying redis client.
     */
    redis: Redis

    /**
     * Construct a redis key.
     *
     * @param args The parts of the key.
     */
    key(...args: string[]): string
}

/**
 * This type provides additional methods defined in node-resque but not
 * defined in @types/node-resque. These methods are used to control the
 * queue via the HTTP API and emit metrics. Additionally, we ensure that
 * the enqueue method supplies only a job class that is defined above.
 */
export interface Queue extends Omit<ResqueQueue, 'enqueue'> {
    /**
     * The underlying connection.
     */
    connection: Connection

    /**
     * Enqueue a job for a worker.
     *
     * @param queue The name of the queue.
     * @param jobName The name of the job class.
     * @param args The positional arguments supplied to the worker.
     */
    enqueue(queue: string, jobName: JobClass, args: any[]): Promise<void>

    /**
     * Return the current status of each worker. This returns a map from worker
     * name to the details of their current job. Defunct workers may have the
     * status 'started', which needs to be filtered out.
     */
    allWorkingOn(): Promise<{ [K: string]: WorkerMeta | 'started' }>

    /**
     * Return all queued jobs.
     *
     * @param q The queue name.
     * @param start The first index.
     * @param stop The lasts index (-1 for end of list).
     */
    queued(q: string, start: number, stop: number): Promise<JobMeta[]>

    /**
     * Return all failed jobs.
     *
     * @param start The first index.
     * @param stop The lasts index (-1 for end of list).
     */
    failed(start: number, stop: number): Promise<FailedJobMeta[]>

    /**
     * Return basic stats about the queue.
     */
    stats(): Promise<{ processed: number | undefined; failed: number | undefined }>

    /**
     * Return the number of queued jobs.
     *
     * @param q The queue name.
     */
    length(q: string): Promise<number>

    /**
     * Return the number of failed jobs.
     */
    failedCount(): Promise<number>
}

/**
 * CLear all failed jobs from the queue.
 *
 * @param queue The queue instance.
 */
export async function clearFailed(queue: Queue): Promise<void> {
    await queue.connection.redis.del(queue.connection.key('failed'))
}

/**
 * This type updates the type of job, success, and failure callbacks of the
 * node-resque Worker class. These types are ill-defined in @types/node-resque.
 */
export interface Worker extends Omit<ResqueWorker, 'on'> {
    // This rule wants to incorrectly combine events with distinct callback types.
    /* eslint-disable @typescript-eslint/unified-signatures */
    on(event: 'start' | 'end' | 'pause', cb: () => void): this
    on(event: 'cleaning_worker', cb: (worker: string, pid: string) => void): this
    on(event: 'poll', cb: (queue: string) => void): this
    on(event: 'ping', cb: (time: number) => void): this
    on(event: 'job', cb: (queue: string, job: Job<any> & JobMeta) => void): this
    on(event: 'reEnqueue', cb: (queue: string, job: Job<any> & JobMeta, plugin: string) => void): this
    on(event: 'success', cb: (queue: string, job: Job<any> & JobMeta, result: any) => void): this
    on(event: 'failure', cb: (queue: string, job: Job<any> & JobMeta, failure: any) => void): this
    on(event: 'error', cb: (error: Error, queue: string, job: Job<any> & JobMeta) => void): this
}

/**
 * Metadata about a job (queued, failed, or active).
 */
export interface JobMeta {
    /**
     * The type of the job.
     */
    class: JobClass

    /**
     * The arguments of the job.
     */
    args: any[]
}

/**
 * Metadata about a job in the failed queue.
 */
export interface FailedJobMeta {
    /**
     * The job parameters.
     */
    payload: JobMeta

    /**
     * The time at which the job failed.
     */
    failed_at: string

    /**
     * The exception message that occurred.
     */
    error: string
}

/**
 * Metadata about a worker's current state.
 */
export interface WorkerMeta {
    /**
     * The job parameters.
     */
    payload: JobMeta

    /**
     * The time at which the job was accepted by the worker.
     */
    run_at: string
}

/**
 * Rewrite a job payload to return to the uer. This rewrites the arguments
 * array from a positional list into an object with meaningful names.
 *
 * @param job The job to rewrite.
 */
export function rewriteJobMeta(job: JobMeta): any {
    return { class: job.class, args: job.args[0] }
}

/**
 * Enqueue a job to be run by the worker.
 *
 * @param queue The job queue.
 * @param job The job name.
 * @param args The job arguments.
 * @param tracer The tracer instance.
 * @param span The parent span.
 */
export const enqueue = (
    queue: Queue,
    job: JobClass,
    args: { [K: string]: any },
    tracer?: Tracer,
    span?: Span
): Promise<void> => {
    if (tracer && span) {
        const tracing = {}
        tracer.inject(span, FORMAT_TEXT_MAP, tracing)
        args.tracing = tracing
    }

    return queue.enqueue('lsif', job, [args])
}
