/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import fetchMock from 'jest-fetch-mock'

fetchMock.enableMocks()

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let errorMock: jest.SpyInstance
let getInputMock: jest.SpyInstance
let setOutputMock: jest.SpyInstance

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    fetchMock.resetMocks()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()

    fetchMock.doMockOnceIf(
      'https://api.omnistrate.cloud/2022-09-01-00/signin',
      JSON.stringify({ jwtToken: 'jwtToken' })
    )
    fetchMock.doMockOnceIf(
      'https://api.omnistrate.cloud/2022-09-01-00/service/service-id/image-config/image-config-id',
      JSON.stringify({})
    )
    fetchMock.doMockOnceIf(
      'https://api.omnistrate.cloud/2022-09-01-00/service/service-id/service-api/service-api-id/release',
      JSON.stringify({})
    )
  })

  it('sets the outputs', async () => {
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'username':
          return 'username'
        case 'password':
          return 'password'
        case 'service-id':
          return 'service-id'
        case 'service-api-id':
          return 'service-api-id'
        case 'product-tier-id':
          return 'product-tier-id'
        case 'image-config-id':
          return 'image-config-id'
        case 'tag':
          return 'tag'
        case 'release-description':
          return 'release-description'

        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all the fetches were called correctly
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.omnistrate.cloud/2022-09-01-00/signin',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'username',
          hashedPassword:
            '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
        })
      }
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.omnistrate.cloud/2022-09-01-00/service/service-id/image-config/image-config-id',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer jwtToken`
        },
        body: JSON.stringify({ imageTag: 'tag' })
      }
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://api.omnistrate.cloud/2022-09-01-00/service/service-id/service-api/service-api-id/release',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer jwtToken`
        },
        body: JSON.stringify({
          isPreferred: false,
          productTierId: 'product-tier-id',
          versionSetName: 'release-description',
          versionSetType: 'Major'
        })
      }
    )

    // Verify that all of the core library functions were called correctly
    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'service-id', 'service-id')
    expect(setOutputMock).toHaveBeenNthCalledWith(
      2,
      'image-config-id',
      'image-config-id'
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(
      3,
      'service-api-id',
      'service-api-id'
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(
      4,
      'product-tier-id',
      'product-tier-id'
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(5, 'tag', 'tag')
    expect(setOutputMock).toHaveBeenNthCalledWith(
      6,
      'release-description',
      'release-description'
    )
    expect(errorMock).not.toHaveBeenCalled()
  })
})
