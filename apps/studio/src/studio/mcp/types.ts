import type { McpActionName } from "../../../../../packages/mcp-contract/index.js"

export { MCP_ACTION_DESCRIPTIONS, MCP_ACTION_SCHEMA, MCP_ACTIONS, type McpActionName } from "../../../../../packages/mcp-contract/index.js"

export type McpJson = null | boolean | number | string | McpJson[] | { [key: string]: McpJson }
export type McpArgs = Record<string, unknown>

export type McpQueuedCommand = {
  id: string
  action: McpActionName
  args: McpArgs
  createdAt: number
}

export type McpCommandSuccess = {
  requestId: string
  ok: true
  result: unknown
}

export type McpCommandFailure = {
  requestId: string
  ok: false
  error: string
  stack?: string
}

export type McpCommandResult = McpCommandSuccess | McpCommandFailure

export type McpExecuteRequest = {
  action: McpActionName
  args?: McpArgs
  timeoutMs?: number
}

export type McpExecuteResponse = {
  requestId: string
  action: McpActionName
  result: unknown
}

export type Vec2 = readonly [number, number]
export type Vec3 = readonly [number, number, number]
