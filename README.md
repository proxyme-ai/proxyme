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

## Deploying the Frontend to Heroku

The repository contains a small Express server under `frontEndCode/server.js`
which serves the compiled Vite `dist/` directory. A `Procfile` at the repository
root instructs Heroku to start this server. To deploy the UI:

```bash
heroku create <app-name>
heroku buildpacks:set heroku/nodejs
git push heroku main
```

During the deploy Heroku runs the `heroku-postbuild` script found in
`frontEndCode/package.json` to install dependencies and build the React
application.

## Continuous Deployment

The repository includes a GitHub Actions workflow under
`.github/workflows/ci.yml` that installs both Python and Node.js
dependencies, builds the frontend and runs the unit tests. You can hook
this workflow up to a Heroku app for automatic deployments:

1. Generate a Heroku API key and add it as the `HEROKU_API_KEY`
   secret on your GitHub repository.
2. Set `HEROKU_APP_NAME` as another repository secret containing the
   name of your Heroku application.
3. Extend the workflow with a deploy step that pushes the contents of
   the repository to Heroku on successful builds.

With these secrets configured, every push to the `main` branch will run
the tests and, if they pass, publish the latest code to your Heroku
application.

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
