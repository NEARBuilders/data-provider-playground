# NEAR Intents Data Dashboard

A dashboard for all things NEAR intents, providing bridge data and analytics across multiple providers.

**Live deployment:** [intents.everything.dev](https://intents.everything.dev)

## Development

```bash
# Install dependencies
bun install

# Start development
bun run dev:plugins    # Start plugin server first
bun run dev            # Then start web + server
```

The web UI will be available at `http://localhost:3001`

## Contributing

### Adding a Plugin

1. Copy the template: `cp -r plugins/_plugin_template plugins/your-provider-plugin`
2. Update `plugin.dev.ts` with your provider configuration
3. Implement provider methods in `src/service.ts`
4. Run tests: `bun run test`

See `plugins/_plugin_template/README.md` for detailed implementation guidance.

## License

Part of the NEAR Intents data collection system.
