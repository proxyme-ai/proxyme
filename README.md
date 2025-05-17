# Proxyme

[![Verified on GitHub](https://img.shields.io/badge/Verified%20Domain-proxyme.ai-blue)](https://github.com/proxyme)

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
