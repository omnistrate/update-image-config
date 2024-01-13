import * as core from '@actions/core'
import * as crypto from 'crypto'

function sha256 (inputString: string): string {
  const hash = crypto.createHash('sha256')
  hash.update(inputString)
  return hash.digest('hex')
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run (): Promise<void> {
  try {
    // Read inputs
    const username = core.getInput('username', { required: true })
    const password = core.getInput('password', { required: true })
    const serviceId = core.getInput('service-id')
    const serviceApiId = core.getInput('service-api-id')
    const productTierId = core.getInput('product-tier-id')
    const imageConfigId = core.getInput('image-config-id')
    const tag = core.getInput('tag', { required: true })
    const releaseDescription = core.getInput('release-description')

    // Hash the password
    const hashedPassword = sha256(password)

    // First API call: Sign In
    const signInResponse = await fetch(
      'https://api.omnistrate.cloud/2022-09-01-00/signin',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: username,
          hashedPassword
        })
      }
    )
    const signInData = await signInResponse.json()
    const jwtToken = String(signInData.jwtToken)

    if (jwtToken === '') {
      throw new Error('Failed to get jwtToken from the sign-in response')
    }

    // Second API call: Update Image Config
    await fetch(
      `https://api.omnistrate.cloud/2022-09-01-00/service/${serviceId}/image-config/${imageConfigId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ imageTag: tag })
      }
    )

    // Third API call: Release Service API
    await fetch(
      `https://api.omnistrate.cloud/2022-09-01-00/service/${serviceId}/service-api/${serviceApiId}/release`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          isPreferred: false,
          productTierId,
          versionSetName: releaseDescription,
          versionSetType: 'Major'
        })
      }
    )

    // Set outputs
    core.setOutput('service-id', serviceId)
    core.setOutput('image-config-id', imageConfigId)
    core.setOutput('service-api-id', serviceApiId)
    core.setOutput('product-tier-id', productTierId)
    core.setOutput('tag', tag)
    core.setOutput('release-description', releaseDescription)

    console.log('Action completed successfully')
  } catch (error) {
    core.setFailed(`Action failed with error: ${(error as Error).message}`)
  }
}
