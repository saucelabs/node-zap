export type SupportedRegions = 'apac' | 'apac-southeast-1'

export interface ZapOptions {
    /**
     * Your Sauce Labs username. Can also be set via `SAUCE_USERNAME` environment
     * variable.
     */
    user?: string
    /**
     * Your Sauce Labs access key. Can also be set via `SAUCE_ACCESS_KEY` environment
     * variable.
     */
    key?: string
    /**
     * Your Sauce Labs datacenter region. The following regions are available:
     *
     * - us-west-1 (short 'us') - not yet available
     * - eu-central-1 (short 'eu') - not yet available
     * - apac-southeast-1 (short 'apac')
     *
     * @default `apac`
     */
    region?: SupportedRegions
    /**
     * Provide a session id if you want to attach yourself
     * to a running session (in which case you don't need to call `newSession`).
     */
    sessionId?: string
}

export default class Zap {
    constructor (opts?: ZapOptions): void

    /**
     * Your Sauce Labs username.
     */
    user: string;
    /**
     * id of the remote session
     */
    sessionId?: string;
    /**
     * Your Sauce Labs datacenter region. The following regions are available:
     *
     * - us-west-1 (short 'us') - not yet available
     * - eu-central-1 (short 'eu') - not yet available
     * - apac-southeast-1 (short 'apac')
     */
    region: '<%- regions.join("' | '") %>';

    <%
    for (const [domain, commands] of Object.entries(domains)) {
        %><%- domain %>: {<%
        for (const command of commands) {
            %>
        /**
         * <%- command.description %>
         */
        <%- command.operation %>(<%
            const requiresParams = command.parameters.filter((p) => p.required).length > 0
            if (command.parameters.length) {
                %>param<%- requiresParams ? '' : '?' %>: {<%
            }

            for (const param of command.parameters) {
                %>
            <%- `${param.nameCamelCased}${param.required ? '' : '?'}: ${param.schema.type.replace('integer', 'number')}` %><%
            }

            if (command.parameters.length) {
                %>
        }<%
            }
        %>): Promise<any><% }
    %>
    }
    <% } %>
}
