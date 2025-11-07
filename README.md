# Data Provider Playground

A playground for building and testing bridge data provider plugins.

## Project Structure

```cmd
data-provider-playground/
├── apps/
│   ├── web/          # Web UI
│   └── server/       # Server application
├── packages/
│   └── api/          # API package
└── plugins/
    └── _plugin_template/  # Template for creating plugins
```

## Development

```bash
# Install dependencies
bun install

# Start development (run these in order)
bun run dev:plugins    # Start plugin server first - wait for it to start
bun run dev            # Then start web + server
```

The web UI will be available at `http://localhost:3001`

## Environment Variables

Create a `.env` file in the root:

```bash
DATA_PROVIDER_API_KEY=your_api_key
DATA_PROVIDER_BASE_URL=https://api.yourprovider.com
DATA_PROVIDER_TIMEOUT=10000
```

## Available Scripts

- `bun run dev:plugins` - Start plugin development server
- `bun run dev` - Start web and server applications
- `bun run build` - Build all packages
- `bun test` - Run tests

## Creating a Plugin

Use the `_plugin_template` in the `plugins/` directory as a starting point for creating new data provider plugins.

## License

Part of the NEAR Intents data collection system.
