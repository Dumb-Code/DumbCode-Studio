import type { NextApiRequest, NextApiResponse } from "next"
import type { McpExecuteRequest } from "../../../src/studio/mcp/types"
import { assertActionName, enqueueCommand, handleApiError, json, methodGuard, requireAgentAuthorization } from "./_state"


export const config = {
  api: {
    bodyParser: { sizeLimit: "100mb" },
    responseLimit: false,
  },
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!methodGuard(req, res, ["POST"])) return
  try {
    requireAgentAuthorization(req)
    const body = req.body as Partial<McpExecuteRequest>
    const action = assertActionName(body?.action)
    const args = body?.args && typeof body.args === "object" ? body.args : {}
    const { id, promise } = enqueueCommand(action, args, body?.timeoutMs)
    const result = await promise
    json(res, 200, { requestId: id, action, result })
  } catch (error) {
    handleApiError(res, error)
  }
}
