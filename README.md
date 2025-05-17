# Proxyme

[![Verified on GitHub](https://img.shields.io/badge/Verified%20Domain-proxyme.ai-blue)](https://proxyme.ai/)
Proxyme is an Authentication and Delegation Service with a React based user interface.
The backend lives under `packages/server/proxyme_service.py` and exposes REST endpoints for issuing and validating delegation tokens. The original frontend under `frontEndCode` provides a modern UI
for interacting with the service.

To start the backend run:

```bash
python packages/server/proxyme_service.py
```

Then in a separate terminal run the default frontend:

```bash
cd frontEndCode
npm install
npm run dev
```

This will launch the Proxyme UI at `http://localhost:5173` (default Vite port).

Alternatively you can try the experimental frontend located in `frontend-alt`:
```bash
cd frontend-alt
npm install
npm run dev
```
This variant runs on port `5174` by default and communicates with the same backend API.


## License

This project is licensed under the [MIT License](LICENSE).

## Integration Modules

The `packages.integrations` package contains placeholder modules for integrating
Proxyme with external systems such as identity providers, MCP servers, CRM
solutions and project management tools. These stubs demonstrate how such
integrations could be structured but they do not perform real API calls.

```
packages/integrations/
├── identity_services.py      # Keycloak and Okta examples
├── mcp_servers.py            # Generic MCP server integration
├── crm_tools.py              # Example Odoo CRM integration
└── project_management.py     # Example Redmine integration
```

These modules are covered by `tests/test_integrations.py` which exercises the
basic stubbed functionality.
