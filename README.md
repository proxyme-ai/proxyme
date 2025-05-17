# Proxyme

[![Verified on GitHub](https://img.shields.io/badge/Verified%20Domain-proxyme.ai-blue)](https://proxyme.ai/)
Proxyme is an Authentication and Delegation Service with a React based user interface.
The backend lives under `pythonHTTPcode` and exposes REST endpoints for issuing and
validating delegation tokens. The frontend under `frontEndCode` provides a modern UI
for interacting with the service.

To start the backend run:

```bash
python pythonHTTPcode/proxyme_service.py
```

Then in a separate terminal run the frontend:

```bash
cd frontEndCode
npm install
npm run dev
```

This will launch the Proxyme UI at `http://localhost:5173` (default Vite port).

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

## Testing

Install Python and Node dependencies and run the test suite using `unittest`:

```bash
pip install -r requirements.txt
cd frontEndCode && npm install && cd ..
python -m unittest discover -v
```

The end-to-end tests build the React frontend and exercise the backend using a headless browser (Playwright). Running the tests will automatically install Playwright's browser binaries.
