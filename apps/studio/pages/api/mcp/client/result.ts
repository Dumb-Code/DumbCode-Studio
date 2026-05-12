import type { NextApiRequest, NextApiResponse } from "next"
import type { McpCommandResult } from "../../../../src/studio/mcp/types"
import { completeCommand, handleApiError, json, methodGuard } from "../_state"


export const config = {
  api: {
    bodyParser: { sizeLimit: "100mb" },
    responseLimit: false,
  },
}
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!methodGuard(req, res, ["POST"])) return
  try {
    const body = req.body as { clientId?: unknown, secret?: unknown, result?: McpCommandResult }
    const result = body?.result
    if (typeof body?.clientId !== "string" || typeof body?.secret !== "string") {
      json(res, 401, { error: "MCP browser client credentials are required" })
      return
    }
    if (!result || typeof result.requestId !== "string" || typeof result.ok !== "boolean") {
      json(res, 400, { error: "Invalid MCP command result payload" })
      return
    }
    if (!result.ok && typeof result.error !== "string") {
      json(res, 400, { error: "Invalid MCP command failure payload" })
      return
    }
    completeCommand(body.clientId, body.secret, result)
    json(res, 200, { ok: true })
  } catch (error) {
    handleApiError(res, error)
  }
}
