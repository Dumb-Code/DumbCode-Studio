#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MCP_ACTION_DESCRIPTIONS, MCP_ACTION_SCHEMA, MCP_ACTIONS } from "../../../packages/mcp-contract/index.js";
const studioBaseUrl = (process.env.DCS_STUDIO_URL ?? "http://localhost:3000").replace(/\/$/, "");
const bearerToken = process.env.DCS_MCP_TOKEN;
const asUrl = (path) => new URL(path, `${studioBaseUrl}/`).toString();
const requestStudio = async (path, init = {}) => {
    const headers = new Headers(init.headers);
    if (bearerToken)
        headers.set("Authorization", `Bearer ${bearerToken}`);
    if (init.body !== undefined && !headers.has("Content-Type"))
        headers.set("Content-Type", "application/json");
    const response = await fetch(asUrl(path), { ...init, headers });
    const text = await response.text();
    let body = text;
    if (text) {
        try {
            body = JSON.parse(text);
        }
        catch {
            body = text;
        }
    }
    if (!response.ok) {
        const message = typeof body === "object" && body !== null && "error" in body ? String(body.error) : text;
        throw new Error(`DumbCode Studio REST call failed (${response.status} ${response.statusText}): ${message}`);
    }
    return body;
};
const executeStudioAction = async (action, args = {}, timeoutMs) => {
    const body = timeoutMs === undefined ? args : { ...args, timeoutMs };
    const response = await requestStudio(`/api/mcp/action/${encodeURIComponent(action)}`, {
        method: "POST",
        body: JSON.stringify(body),
    });
    if (typeof response === "object" && response !== null && "result" in response) {
        return response.result;
    }
    return response;
};
const toolText = (value) => ({
    content: [{ type: "text", text: value === undefined ? "undefined" : (typeof value === "string" ? value : JSON.stringify(value, null, 2)) }],
});
const timeoutSchema = z.number().int().positive().max(600000).optional().describe("Optional action timeout in milliseconds");
const argsSchema = z.record(z.unknown()).optional().describe("Backward-compatible action-specific arguments object");
const directActionInputSchema = (action) => {
    const shape = {
        args: argsSchema,
        timeoutMs: timeoutSchema,
    };
    for (const [name, description] of Object.entries(MCP_ACTION_SCHEMA[action])) {
        shape[name] = z.unknown().optional().describe(description);
    }
    return z.object(shape).passthrough();
};
const normalizeActionArgs = (input) => {
    const { args, timeoutMs: _timeoutMs, ...directArgs } = input;
    const baseArgs = args !== undefined && typeof args === "object" && args !== null && !Array.isArray(args)
        ? args
        : {};
    return { ...baseArgs, ...directArgs };
};
const server = new McpServer({
    name: "dumbcode-studio",
    version: "1.0.0",
});
server.registerTool("dcs_status", {
    description: "Check the DumbCode Studio REST bridge, connected browser clients, queue depth, and available actions.",
    inputSchema: {},
}, async () => toolText(await requestStudio("/api/mcp/health")));
server.registerTool("dcs_action", {
    description: "Run any DumbCode Studio action. Call dcs_get_action_schema first when choosing argument names.",
    inputSchema: {
        action: z.enum([...MCP_ACTIONS]).describe("DumbCode Studio action name"),
        args: z.record(z.unknown()).optional().describe("Action-specific arguments. See dcs_get_action_schema."),
        timeoutMs: timeoutSchema,
    },
}, async ({ action, args, timeoutMs }) => toolText(await executeStudioAction(action, args ?? {}, timeoutMs)));
for (const action of MCP_ACTIONS) {
    server.registerTool(`dcs_${action}`, {
        description: `${MCP_ACTION_DESCRIPTIONS[action]} Pass fields directly, or pass { args: ... } for compatibility.`,
        inputSchema: directActionInputSchema(action),
    }, async (input) => toolText(await executeStudioAction(action, normalizeActionArgs(input), input.timeoutMs)));
}
const main = async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
};
main().catch(error => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(message);
    process.exit(1);
});
//# sourceMappingURL=index.js.map