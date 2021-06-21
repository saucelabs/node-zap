export default class Zap {
    /**
     * Your Sauce Labs username.
     */
    user: string;
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
        <%- command.operation %>(<%- command.parameters.map((param) => `${param.name}${param.required ? '' : '?'}: ${param.schema.type.replace('integer', 'number')}`).join(', ') %>): Promise<any><% }
    %>
    }
    <% } %>
}
