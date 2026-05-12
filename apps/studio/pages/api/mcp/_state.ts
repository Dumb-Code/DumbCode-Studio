import type { NextApiRequest, NextApiResponse } from "next"
import { randomUUID } from "crypto"
import { MCP_ACTIONS, type McpActionName, type McpArgs, type McpCommandResult, type McpQueuedCommand } from "../../../src/studio/mcp/types"

type QueuedCommand = McpQueuedCommand & {
  targetClientId: string
  leasedAt?: number
  leaseExpiresAt?: number
}

type PendingCommand = QueuedCommand & {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  timer: NodeJS.Timeout
  timeoutAt: number
}

type ClientState = {
  id: string
  secret: string
  firstSeenAt: number
  lastSeenAt: number
  lastFocusedAt: number
  visible: boolean
  focused: boolean
  userAgent?: string
}

type McpApiState = {
  queue: QueuedCommand[]
  pending: Map<string, PendingCommand>
  clients: Map<string, ClientState>
}

const globalKey = "__dumbcode_studio_mcp_api_state__"

const state = (() => {
  const g = globalThis as typeof globalThis & { [globalKey]?: McpApiState }
  if (!g[globalKey]) {
    g[globalKey] = {
      queue: [],
      pending: new Map(),
      clients: new Map(),
    }
  }
  return g[globalKey]!
})()

const DEFAULT_TIMEOUT_MS = 30_000
const MAX_TIMEOUT_MS = 10 * 60_000
const MAX_QUEUE_LENGTH = 500
const CLIENT_STALE_MS = 20_000
const COMMAND_LEASE_MS = 10_000

const isMcpActionName = (value: unknown): value is McpActionName =>
  typeof value === "string" && (MCP_ACTIONS as readonly string[]).includes(value)

export class McpHttpError extends Error {
  readonly statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

export const json = (res: NextApiResponse, status: number, body: unknown) => {
  res.setHeader("Cache-Control", "no-store")
  res.status(status).json(body)
}

export const methodGuard = (req: NextApiRequest, res: NextApiResponse, methods: readonly string[]) => {
  if (!methods.includes(req.method ?? "")) {
    res.setHeader("Allow", methods.join(", "))
    json(res, 405, { error: `Method ${req.method} is not allowed. Use ${methods.join(", ")}.` })
    return false
  }
  return true
}

export const requireAgentAuthorization = (req: NextApiRequest) => {
  const expected = process.env.DCS_MCP_TOKEN
  if (!expected) {
    return
  }

  const header = req.headers.authorization ?? ""
  const token = Array.isArray(header) ? header[0] : header
  if (token !== `Bearer ${expected}`) {
    throw new McpHttpError(401, "Invalid or missing DCS_MCP_TOKEN bearer token")
  }
}

const publicClient = ({ secret: _secret, ...client }: ClientState) => client

const firstHeader = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export const readClientCredentials = (req: NextApiRequest) => {
  const clientId = firstHeader(req.headers["x-dcs-mcp-client-id"]) ?? (typeof req.query.clientId === "string" ? req.query.clientId : undefined)
  const secret = firstHeader(req.headers["x-dcs-mcp-client-secret"]) ?? (typeof req.query.secret === "string" ? req.query.secret : undefined)
  if (!clientId || !secret) {
    throw new McpHttpError(401, "MCP browser client credentials are required")
  }
  return { clientId, secret }
}

export const assertClientCredentials = (clientId: string, secret: string) => {
  const client = state.clients.get(clientId)
  if (!client || client.secret !== secret) {
    throw new McpHttpError(401, "Invalid MCP browser client credentials")
  }
  return client
}

export const pruneClients = () => {
  const cutoff = Date.now() - CLIENT_STALE_MS
  for (const [id, client] of state.clients) {
    if (client.lastSeenAt < cutoff) {
      state.clients.delete(id)
    }
  }
}

const pruneExpiredLeases = () => {
  const current = Date.now()
  state.queue.forEach(command => {
    if (command.leaseExpiresAt !== undefined && command.leaseExpiresAt <= current) {
      delete command.leasedAt
      delete command.leaseExpiresAt
    }
  })
}

export const listClients = () => {
  pruneClients()
  return [...state.clients.values()].sort((a, b) => b.lastSeenAt - a.lastSeenAt).map(publicClient)
}

const sortActiveClients = (candidates: ClientState[]) =>
  candidates.sort((a, b) => {
    if (a.focused !== b.focused) return a.focused ? -1 : 1
    if (a.lastFocusedAt !== b.lastFocusedAt) return b.lastFocusedAt - a.lastFocusedAt
    return b.lastSeenAt - a.lastSeenAt
  })[0]

const getActiveClient = () => {
  pruneClients()
  const visible = [...state.clients.values()].filter(client => client.visible)
  if (visible.length > 0) {
    return sortActiveClients(visible)
  }
  const any = [...state.clients.values()]
  if (any.length === 0) return null
  return sortActiveClients(any)
}

export const registerClient = (id: string, secret: string, userAgent?: string, visible = true, focused = true) => {
  const currentTime = Date.now()
  const existing = state.clients.get(id)
  if (existing && existing.secret !== secret) {
    throw new McpHttpError(401, "Invalid MCP browser client secret")
  }
  state.clients.set(id, {
    id,
    secret,
    firstSeenAt: existing?.firstSeenAt ?? currentTime,
    lastSeenAt: currentTime,
    lastFocusedAt: focused ? currentTime : existing?.lastFocusedAt ?? currentTime,
    visible,
    focused,
    userAgent: userAgent ?? existing?.userAgent,
  })
}

export const pollCommands = (clientId: string, secret: string, userAgent?: string, maxCommands = 10, visible = true, focused = true) => {
  registerClient(clientId, secret, userAgent, visible, focused)
  pruneExpiredLeases()
  const active = getActiveClient()
  if (!active || active.id !== clientId) {
    return []
  }

  const max = Math.max(1, Math.min(25, maxCommands))
  const currentTime = Date.now()
  const commands: McpQueuedCommand[] = []
  for (const command of state.queue) {
    if (commands.length >= max) break
    if (command.targetClientId !== clientId) continue
    if (command.leaseExpiresAt !== undefined && command.leaseExpiresAt > currentTime) continue
    command.leasedAt = currentTime
    command.leaseExpiresAt = currentTime + COMMAND_LEASE_MS
    const { targetClientId: _targetClientId, leasedAt: _leasedAt, leaseExpiresAt: _leaseExpiresAt, ...queued } = command
    commands.push(queued)
  }
  return commands
}

export const enqueueCommand = (action: McpActionName, args: McpArgs = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  pruneClients()
  const target = getActiveClient()
  if (!target) {
    throw new McpHttpError(503, "No active DumbCode Studio browser bridge is connected. Open Studio in a visible browser tab and keep it focused.")
  }
  if (state.queue.length >= MAX_QUEUE_LENGTH) {
    throw new McpHttpError(429, `MCP command queue is full (${MAX_QUEUE_LENGTH} pending commands)`)
  }

  const requestedTimeout = Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS
  const safeTimeout = Math.max(1_000, Math.min(MAX_TIMEOUT_MS, requestedTimeout))
  const id = randomUUID()
  const createdAt = Date.now()
  const queued: QueuedCommand = { id, action, args, createdAt, targetClientId: target.id }

  const promise = new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(() => {
      state.pending.delete(id)
      state.queue = state.queue.filter(command => command.id !== id)
      reject(new McpHttpError(504, `Timed out waiting for DumbCode Studio browser bridge ${target.id} to execute ${action}. Keep the Studio tab visible and focused.`))
    }, safeTimeout)

    state.pending.set(id, {
      ...queued,
      resolve,
      reject,
      timer,
      timeoutAt: createdAt + safeTimeout,
    })
  })

  state.queue.push(queued)
  return { id, action, promise }
}

export const completeCommand = (clientId: string, secret: string, result: McpCommandResult) => {
  assertClientCredentials(clientId, secret)
  const pending = state.pending.get(result.requestId)
  if (!pending) {
    throw new McpHttpError(404, `No pending MCP command with id ${result.requestId}`)
  }
  if (pending.targetClientId !== clientId) {
    throw new McpHttpError(403, `MCP command ${result.requestId} belongs to another Studio browser bridge`)
  }

  clearTimeout(pending.timer)
  state.pending.delete(result.requestId)
  state.queue = state.queue.filter(command => command.id !== result.requestId)

  if (result.ok) {
    pending.resolve(result.result)
  } else {
    const error = new McpHttpError(500, result.error || "DumbCode Studio browser bridge failed without an error message")
    if (result.stack) {
      error.stack = result.stack
    }
    pending.reject(error)
  }
}

export const getQueueSummary = () => ({
  queued: state.queue.length,
  pending: state.pending.size,
  activeClientId: getActiveClient()?.id ?? null,
  clients: listClients(),
  actions: MCP_ACTIONS,
})

export const assertActionName = (value: unknown): McpActionName => {
  if (!isMcpActionName(value)) {
    throw new McpHttpError(400, `Unknown MCP action '${String(value)}'. Use get_action_schema or /api/mcp/actions.`)
  }
  return value
}

export const handleApiError = (res: NextApiResponse, error: unknown) => {
  if (error instanceof McpHttpError) {
    json(res, error.statusCode, { error: error.message })
    return
  }
  const message = error instanceof Error ? error.message : String(error)
  json(res, 500, { error: message })
}
