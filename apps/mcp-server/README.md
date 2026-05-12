# DumbCode Studio MCP Server

This package exposes DumbCode Studio as a local Model Context Protocol server. It forwards MCP tool calls to the Studio REST bridge under `/api/mcp/*`; the open Studio browser tab polls that bridge and executes commands inside the real React/Three Studio state.

## Run

From the repository root:

```powershell
yarn install
yarn workspace dumbcode-studio-mcp build
$env:DCS_STUDIO_URL="http://localhost:3000"; yarn workspace dumbcode-studio-mcp start
```

Start Studio separately and keep it open in a browser:

```powershell
yarn workspace studio dev
```

Then visit `http://localhost:3000`. The browser tab registers itself with `/api/mcp/health`.

## Optional bearer token

To require a token on external MCP-to-Studio REST calls, start both the MCP server and Studio with the same environment value:

```powershell
$env:DCS_MCP_TOKEN="your-long-random-token"; $env:DCS_STUDIO_URL="http://localhost:3000"; yarn workspace dumbcode-studio-mcp start
```

## MCP host configuration

Example stdio configuration:

```json
{
  "mcpServers": {
    "dumbcode-studio": {
      "command": "node",
      "args": ["/absolute/path/to/DumbCode-Studio/apps/mcp-server/dist/index.js"],
      "env": {
        "DCS_STUDIO_URL": "http://localhost:3000"
      }
    }
  }
}
```

With bearer authentication enabled:

```json
{
  "mcpServers": {
    "dumbcode-studio": {
      "command": "node",
      "args": ["/absolute/path/to/DumbCode-Studio/apps/mcp-server/dist/index.js"],
      "env": {
        "DCS_STUDIO_URL": "http://localhost:3000",
        "DCS_MCP_TOKEN": "your-long-random-token"
      }
    }
  }
}
```

## Main tools

- `dcs_status` checks whether Studio is reachable and whether a browser bridge is connected.
- `dcs_get_action_schema` returns every available Studio action and argument contract.
- `dcs_action` executes any action by name.
- `dcs_<action>` tools expose each action directly, for example `dcs_create_cube`, `dcs_create_animation`, `dcs_set_keyframe_transform`, and `dcs_export_asset`.
