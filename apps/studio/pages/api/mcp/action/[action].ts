import type { NextApiRequest, NextApiResponse } from "next"
import { assertActionName, enqueueCommand, handleApiError, json, methodGuard, requireAgentAuthorization } from "../_state"


export const config = {
  api: {
    bodyParser: { sizeLimit: "100mb" },
    responseLimit: false,
  },
}
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!methodGuard(req, res, ["POST"])) return
  try {
    requireAgentAuthorization(req)
    const action = assertActionName(first(req.query.action))
    const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {}
    const timeoutMs = typeof body.timeoutMs === "number" ? body.timeoutMs : undefined
    const { timeoutMs: _timeoutMs, ...args } = body
    const { id, promise } = enqueueCommand(action, args, timeoutMs)
    const result = await promise
    json(res, 200, { requestId: id, action, result })
  } catch (error) {
    handleApiError(res, error)
  }
}
