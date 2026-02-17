# Design Decisions

## Dependency audit and installation
- Added runtime dependencies that are referenced in the server code but missing from package.json: express, cors, morgan, simple-git, uuid.
- Did not add path-alias imports (e.g. @/components/...) since they resolve via tsconfig/vite aliasing, not npm packages.
- Did not add Node built-ins (fs, path, util) since they ship with the runtime.

## Notes API integration and timestamps
- Frontend now loads/saves notes through the server API instead of localStorage to keep a single source of truth.
- Backend normalizes legacy note files to include title/content and createdAt/updatedAt, writing back missing timestamps to the file when absent.
- Sorting relies on note timestamps stored in the note file rather than a separate tracking database.
- Static assets are served from dist to match the Vite build output, with a Bun build script for static output.
