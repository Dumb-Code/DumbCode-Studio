import type { NextApiRequest, NextApiResponse } from "next"
import { handleApiError, json, methodGuard, pollCommands, readClientCredentials } from "../_state"

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
const asBool = (value: string | undefined, fallback: boolean) => value === undefined ? fallback : value === "true"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!methodGuard(req, res, ["GET"])) return
  try {
    const { clientId, secret } = readClientCredentials(req)
    const max = Number(first(req.query.maxCommands) ?? 10)
    const visible = asBool(first(req.query.visible), true)
    const focused = asBool(first(req.query.focused), true)
    const commands = pollCommands(clientId, secret, req.headers["user-agent"], Number.isFinite(max) ? max : 10, visible, focused)
    json(res, 200, { commands })
  } catch (error) {
    handleApiError(res, error)
  }
}
