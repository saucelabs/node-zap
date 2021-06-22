import type { OpenAPIV3 } from 'openapi-types'

import { TO_STRING_TAG } from './constants'
import type APIBinding from './index'

/**
 * Translate region shorthandle option into the full region
 * @param  {object}  options  client options
 * @return {string}           full region
 */
export function getRegionSubDomain (options: { region?: string } = {}) {
    let region = options.region || 'us-west-1'

    if (options.region === 'us') region = 'us-west-1'
    if (options.region === 'eu') region = 'eu-central-1'
    if (options.region === 'apac') region = 'apac-southeast-1'
    return region
}

/**
 * toString method for proxy instance
 * @param  {object} scope  actual API instance
 * @return {string}        to string output
 */
export function toString (scope: APIBinding) {
    return `${TO_STRING_TAG} {
  username: '${scope.user}',
  key: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXX${scope['_accessKey'].slice(-6)}',
  region: '${scope['_options'].region}'
}`
}
