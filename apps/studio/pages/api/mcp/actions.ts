import type { NextApiRequest, NextApiResponse } from "next"
import { MCP_ACTION_DESCRIPTIONS, MCP_ACTION_SCHEMA, MCP_ACTIONS } from "../../../src/studio/mcp/types"
import { handleApiError, json, methodGuard, requireAgentAuthorization } from "./_state"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!methodGuard(req, res, ["GET"])) return
  try {
    requireAgentAuthorization(req)
    json(res, 200, {
      actions: MCP_ACTIONS.map(name => ({
        name,
        description: MCP_ACTION_DESCRIPTIONS[name],
        args: MCP_ACTION_SCHEMA[name],
        endpoint: `/api/mcp/action/${name}`,
      })),
    })
  } catch (error) {
    handleApiError(res, error)
  }
}
