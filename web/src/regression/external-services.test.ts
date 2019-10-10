/**
 * @jest-environment node
 */

import { TestResourceManager } from './util/TestResourceManager'
import { GraphQLClient } from './util/GraphQLClient'
import { Driver } from '../../../shared/src/e2e/driver'
import { getConfig } from '../../../shared/src/e2e/config'
import { getTestFixtures } from './util/init'
import { ensureLoggedInOrCreateTestUser } from './util/helpers'
import { deleteUser, setUserSiteAdmin, getUser, ensureNoTestExternalServices } from './util/api'
import { retry } from '../../../shared/src/e2e/e2e-test-utils'
import * as GQL from '../../../shared/src/graphql/schema'

describe('External services regression test suite', () => {
    const testUsername = 'test-extsvc'
    const config = getConfig(
        'sudoToken',
        'sudoUsername',
        'gitHubToken',
        'sourcegraphBaseUrl',
        'noCleanup',
        'testUserPassword',
        'logBrowserConsole',
        'slowMo',
        'headless',
        'keepBrowser'
    )

    let driver: Driver
    let gqlClient: GraphQLClient
    let resourceManager: TestResourceManager
    beforeAll(async () => {
        ;({ driver, gqlClient, resourceManager } = await getTestFixtures(config))
        await resourceManager.create({
            type: 'User',
            name: testUsername,
            create: () =>
                ensureLoggedInOrCreateTestUser(driver, gqlClient, {
                    username: testUsername,
                    deleteIfExists: true,
                    ...config,
                }),
            destroy: () => deleteUser(gqlClient, testUsername, false),
        })
        const user = await getUser(gqlClient, testUsername)
        if (!user) {
            throw new Error(`test user ${testUsername} does not exist`)
        }
        await setUserSiteAdmin(gqlClient, user.id, true)
    })

    afterAll(async () => {
        if (!config.noCleanup) {
            await resourceManager.destroyAll()
        }
        if (driver) {
            await driver.close()
        }
    })

    test('9.1. GitHub.com. In addition to verifying the correct repos are added, verify permissions are correct.', async () => {
        const externalServiceName = '[TEST] Regression test: GitHub.com'
        await ensureNoTestExternalServices(gqlClient, {
            kind: GQL.ExternalServiceKind.GITHUB,
            uniqueDisplayName: externalServiceName,
            deleteIfExist: true,
        })

        await driver.page.goto(config.sourcegraphBaseUrl + '/site-admin/external-services')
        await retry(() => driver.clickElementWithText('Add external service'), { retries: 3, maxRetryTime: 500 })
        await retry(() => driver.clickElementWithText('Add GitHub.com repositories.'), {
            retries: 3,
            maxRetryTime: 500,
        })
        const repoSlugs = ['gorilla/mux']
        const githubConfig = `{
            "url": "https://github.com",
            "token": ${JSON.stringify(config.gitHubToken)},
            "repos": ${JSON.stringify(repoSlugs)},
            "repositoryQuery": ["none"],
        }`
        await driver.replaceText({
            selector: '#e2e-external-service-form-display-name',
            newText: externalServiceName,
            selectMethod: 'selectall',
            enterTextMethod: 'paste',
        })
        await driver.replaceText({
            selector: '.monaco-editor',
            newText: githubConfig,
            selectMethod: 'keyboard',
            enterTextMethod: 'paste',
        })
        await retry(() => driver.clickElementWithText('Add external service', { tagName: 'button' }), {
            retries: 3,
            maxRetryTime: 500,
        })
        await resourceManager.create({
            type: 'External service',
            name: externalServiceName,
            create: () => Promise.resolve(), // already created above
            destroy: () =>
                ensureNoTestExternalServices(gqlClient, {
                    kind: GQL.ExternalServiceKind.GITHUB,
                    uniqueDisplayName: externalServiceName,
                    deleteIfExist: true,
                }),
        })

        // TODO: Check authz
    })

    // test('9.2. GitHub Enterprise. In addition to verifying the correct repos are added, verify permissions are correct. #lyft', async () => {
    //     //
    // })

    // test('9.3. AWS CodeCommit', async () => {
    //     //
    // })

    // test('9.4. Bitbucket Server', async () => {
    //     // TODO
    // })

    // test('9.4.1 Bitbucket Server ACLs', async () => {
    //     // TODO
    // })

    // test('9.5. GitLab. In addition to verifying the correct repos are added, verify permissions with identityProvider type "external", "oauth", and "username".', async () => {
    //     // TODO
    // })

    // test('9.6. Gitolite. Include in the test verification of the phabricator field. #uber', async () => {
    //     // TODO
    // })

    // test('9.7. Phabricator connection', async () => {
    //     // TODO
    // })

    // test('9.8. Single Git repositories', async () => {
    //     // TODO
    // })

    // test('9.9 When `repositoryPathPattern` is configured, paths from the full long name will redirect to the configured name. Extensions will function with the configured name. `repositoryPathPattern` allows administrators to configure "nice names". For example `so', async () => {
    //     // TODO
    // })

    // test('9.10. Bitbucket Cloud', async () => {
    //     // TODO
    // })

    // test('9.11. Status indicator in the navigation bar is enabled.', async () => {
    //     // TODO
    // })

    // test('9.12. In the GitHub and Bitbucket Server external service configs, `repositoryQuery` is only required if `repos` is not set.', async () => {
    //     // TODO
    // })

    // test('9.13 Updating or creating an external service will no longer block until the service is synced. ', async () => {
    //     // TODO
    // })
})
