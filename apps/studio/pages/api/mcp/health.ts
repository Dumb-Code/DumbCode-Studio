import type { NextApiRequest, NextApiResponse } from "next"
import { getQueueSummary, handleApiError, json, methodGuard, requireAgentAuthorization } from "./_state"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!methodGuard(req, res, ["GET"])) return
  try {
    requireAgentAuthorization(req)
    json(res, 200, {
      ok: true,
      now: new Date().toISOString(),
      ...getQueueSummary(),
    })
  } catch (error) {
    handleApiError(res, error)
  }
}
