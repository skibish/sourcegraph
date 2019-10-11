import * as fs from 'mz/fs'
import rmfr from 'rmfr'
import { XrepoDatabase, MAX_TRAVERSAL_LIMIT } from './xrepo'
import { getCleanSqliteDatabase } from './test-utils'
import { entities } from './xrepo.models'

describe('XrepoDatabase', () => {
    let storageRoot!: string

    beforeAll(async () => {
        storageRoot = await fs.mkdtemp('xrepo-', { encoding: 'utf8' })
    })

    afterAll(async () => await rmfr(storageRoot))

    // factory for randomly named xrepo database instance
    const createXrepoDatabase = async () => new XrepoDatabase(await getCleanSqliteDatabase(storageRoot, entities))

    it('should find closest commits with LSIF data', async () => {
        const xrepoDatabase = await createXrepoDatabase()

        // This database has the following commit graph:
        //
        // [a] --+--- b --------+--e -- f --+-- [g]
        //       |              |           |
        //       +-- [c] -- d --+           +--- h

        await xrepoDatabase.updateCommits('foo', [
            ['a', ''],
            ['b', 'a'],
            ['c', 'a'],
            ['d', 'c'],
            ['e', 'b'],
            ['e', 'd'],
            ['f', 'e'],
            ['g', 'f'],
            ['h', 'f'],
        ])

        // Add relations
        await xrepoDatabase.insertDump('foo', 'a', '')
        await xrepoDatabase.insertDump('foo', 'c', '')
        await xrepoDatabase.insertDump('foo', 'g', '')

        // Test closest commit
        expect(await xrepoDatabase.findClosestDump('foo', 'a', 'file')).toEqual('a')
        expect(await xrepoDatabase.findClosestDump('foo', 'b', 'file')).toEqual('a')
        expect(await xrepoDatabase.findClosestDump('foo', 'c', 'file')).toEqual('c')
        expect(await xrepoDatabase.findClosestDump('foo', 'd', 'file')).toEqual('c')
        expect(await xrepoDatabase.findClosestDump('foo', 'f', 'file')).toEqual('g')
        expect(await xrepoDatabase.findClosestDump('foo', 'g', 'file')).toEqual('g')

        // Multiple nearest are chosen arbitrarily
        expect(['a', 'c', 'g']).toContain(await xrepoDatabase.findClosestDump('foo', 'e', 'file'))
        expect(['a', 'c']).toContain(await xrepoDatabase.findClosestDump('foo', 'h', 'file'))
    })

    it('should return empty string as closest commit with no reachable lsif data', async () => {
        const xrepoDatabase = await createXrepoDatabase()

        // This database has the following commit graph:
        //
        // a --+-- [b] ---- c
        //     |
        //     +--- d --+-- e -- f
        //              |
        //              +-- g -- h

        await xrepoDatabase.updateCommits('foo', [
            ['a', ''],
            ['b', 'a'],
            ['c', 'b'],
            ['d', 'a'],
            ['e', 'd'],
            ['f', 'e'],
            ['g', 'd'],
            ['h', 'g'],
        ])

        // Add markers
        await xrepoDatabase.insertDump('foo', 'b', 'file')

        // Test closest commit
        expect(await xrepoDatabase.findClosestDump('foo', 'a', 'file')).toEqual('b')
        expect(await xrepoDatabase.findClosestDump('foo', 'b', 'file')).toEqual('b')
        expect(await xrepoDatabase.findClosestDump('foo', 'c', 'file')).toEqual('b')
        expect(await xrepoDatabase.findClosestDump('foo', 'd', 'file')).toBeUndefined()
        expect(await xrepoDatabase.findClosestDump('foo', 'e', 'file')).toBeUndefined()
        expect(await xrepoDatabase.findClosestDump('foo', 'f', 'file')).toBeUndefined()
        expect(await xrepoDatabase.findClosestDump('foo', 'g', 'file')).toBeUndefined()
        expect(await xrepoDatabase.findClosestDump('foo', 'h', 'file')).toBeUndefined()
    })

    it('should not return elements farther than MAX_TRAVERSAL_LIMIT', async () => {
        const xrepoDatabase = await createXrepoDatabase()

        // This repository has the following commit graph (ancestors to the right):
        //
        // 0 -- 1 -- 2 -- ... -- MAX_TRAVERSAL_LIMIT

        const commits: [string, string][] = Array.from({ length: MAX_TRAVERSAL_LIMIT }, (_, i) => [`${i}`, `${i + 1}`])

        await xrepoDatabase.updateCommits('foo', commits)

        // Add markers
        await xrepoDatabase.insertDump('foo', '0', 'file')

        // Test closest commit
        expect(await xrepoDatabase.findClosestDump('foo', '0', 'file')).toEqual('0')
        expect(await xrepoDatabase.findClosestDump('foo', '1', 'file')).toEqual('0')
        expect(await xrepoDatabase.findClosestDump('foo', '49', 'file')).toEqual('0')

        // At commit 50, the traversal limit will be reached before visiting commit 0 because commits are visited in this order:
        // - 1: 50 (with direction 'A')
        // - 2: 50 (with direction 'D')
        // - 3: 51
        // - 4: 49
        // - 5: 52
        // - 6: 48
        // - ...
        // - 99: 99
        // - 100: 1 (limit reached)
        expect(await xrepoDatabase.findClosestDump('foo', '50', 'file')).toBeUndefined()

        // Mark commit 1
        await xrepoDatabase.insertDump('foo', '1', 'file')

        // Now commit 1 should be found
        expect(await xrepoDatabase.findClosestDump('foo', '50', 'file')).toEqual('1')
    })
})
