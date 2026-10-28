# DevPilot — AI-Powered Codebase Explorer

**Understand your repository. Ask better questions. Navigate code with AI.**

DevPilot (the application in this repository, currently named **RepoScanner** on GitHub) connects to GitHub repositories, indexes repository content, and provides a workspace for asking questions about a codebase. The backend uses Spring Boot, Spring AI, PostgreSQL/PGVector, and a configurable NVIDIA-hosted inference API.

- **Repository:** [HeavenlyCalamity/RepoScanner](https://github.com/HeavenlyCalamity/RepoScanner)
- **Web app:** [heavenlycalamity.tech](https://heavenlycalamity.tech)

> DevPilot is an AI-assisted code exploration project. Model output can be incorrect; verify generated explanations and suggestions against the source code.

## Features

- **GitHub sign-in** using Spring Security OAuth2 Client.
- **Repository workspace** for listing and importing repositories accessible to the signed-in GitHub account.
- **Repository indexing** with progress states (`PENDING`, `INDEXING`, `READY`, and `FAILED`).
- **Retrieval-augmented chat** using indexed repository content and PostgreSQL/PGVector.
- **Conversation history** with repository-associated chat sessions, message retrieval, rename, and delete operations.
- **Source citations** in the chat data model, including file paths and optional line ranges or excerpts when returned by the backend.
- **Configurable NVIDIA inference** through the OpenAI-compatible API client supported by Spring AI.
- **Responsive frontend** with light/dark theme support.

## Architecture

```text
Browser
  │
  ▼
Next.js frontend (client/)
  │  HTTPS + session cookies
  ▼
Spring Boot REST API (backend/)
  ├── GitHub OAuth and repository access
  ├── Repository indexing and retrieval
  ├── Spring AI / NVIDIA-hosted model API
  └── PostgreSQL + PGVector
```

### Technology stack

| Area | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Frontend utilities | TanStack Query, Next Themes, Lucide React, Streamdown |
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA |
| AI | Spring AI OpenAI-compatible model client, NVIDIA-hosted inference API |
| Database | PostgreSQL with the `vector` extension (PGVector) |
| Authentication | GitHub OAuth 2.0 and server-side session cookies |
| Local database | Docker Compose with `pgvector/pgvector:pg16` |

## Repository layout

```text
.
├── backend/                         # Spring Boot API
│   ├── pom.xml
│   └── src/main/resources/
│       └── application.properties   # Spring and environment configuration
├── client/                          # Next.js web application
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/api.ts
│   └── package.json
├── docker/
│   └── postgres/init-extensions.sql # PostgreSQL extensions for local development
├── docker-compose.yml               # Local PostgreSQL/PGVector service
└── README.md
```

## Requirements

For local development, install:

- Git
- Java 21 JDK
- Maven compatible with the backend build
- Node.js version supported by Next.js 16 (Node.js 20.9 or newer is a suitable baseline)
- npm
- Docker Desktop or Docker Engine with Docker Compose
- A GitHub OAuth App for sign-in
- An NVIDIA API key and access to the configured chat and embedding models

## Run locally

### 1. Clone the repository

```bash
git clone https://github.com/HeavenlyCalamity/RepoScanner.git
cd RepoScanner
```

### 2. Start PostgreSQL with PGVector

The root `docker-compose.yml` starts PostgreSQL with the `pgvector/pgvector:pg16` image and publishes it on port `55432`.

```bash
docker compose up -d db
```

The development defaults in the Compose file are:

| Setting | Local value |
|---|---|
| Host | `localhost` |
| Port | `55432` |
| Database | `postgre` |
| Username | `devpilot` |
| Password | `postgre` |

The database initialization script enables `vector`, `hstore`, and `uuid-ossp`. These credentials are for local development only; do not use them in a public or production deployment.

To stop the local database:

```bash
docker compose down
```

To also delete the local database volume (this permanently removes its stored data):

```bash
docker compose down -v
```

### 3. Configure the backend

The backend reads its configuration from `backend/src/main/resources/application.properties`. Supply credentials through environment variables; do not commit real credentials to source control.

| Variable | Purpose | Local example / default |
|---|---|---|
| `DB_URL` | JDBC URL for PostgreSQL | `jdbc:postgresql://localhost:55432/postgre` |
| `DB_USERNAME` | Database user | `devpilot` |
| `DB_PASSWORD` | Database password | `postgre` |
| `NVIDIA_API_KEY` | NVIDIA inference API credential | Obtain from NVIDIA; keep secret |
| `NVIDIA_BASE_URL` | OpenAI-compatible inference base URL | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | Chat model identifier | `nvidia/nemotron-3.5-lightning-30b-a3b` |
| `NVIDIA_EMBEDDING_MODEL` | Embedding model identifier | `nvidia/nemotron-3.5-embed-1b` |
| `NVIDIA_EMBEDDING_DIMENSIONS` | Embedding vector dimensions | `1536` |
| `NVIDIA_EMBEDDING_INPUT_TYPE` | Embedding input type | `passage` |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | From your GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | From your GitHub OAuth App; keep secret |
| `BACKEND_URL` | Public base URL used to build the OAuth callback | `http://localhost:8080` |
| `FRONTEND_URL` | Frontend origin used after OAuth | `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:3000` |
| `ENCRYPTION_PASSWORD` | Password for application data encryption | Set a strong secret |
| `ENCRYPTION_SALT` | Hexadecimal salt for application encryption | Use a hex-only value; see security notes |
| `TOKEN_ENCRYPTOR_PASSWORD` | Password for token encryption | Set a strong secret |
| `TOKEN_ENCRYPTOR_SALT` | Hexadecimal salt for token encryption | Use a hex-only value; see security notes |

The model identifiers above reflect the repository's current configuration defaults. Confirm that your NVIDIA account supports them. If you change the embedding model, ensure the configured dimensions match the model and your PGVector schema.

#### GitHub OAuth for local development

Create a GitHub OAuth App and configure its callback URL as:

```text
http://localhost:8080/login/oauth2/code/github
```

Use a separate OAuth App for local development if your production OAuth App is configured with a different callback URL. The required scopes in the application configuration are `read:user` and `repo`.

#### Start the backend

From the `backend` directory, run:

```bash
cd backend
mvn spring-boot:run
```

The backend listens on port `8080` by default unless `server.port` or the deployment-provided `PORT` overrides it.

### 4. Configure and start the frontend

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

This variable is public because it contains the API base URL. **Never put an NVIDIA key, GitHub client secret, database password, or encryption password in a `NEXT_PUBLIC_*` variable.**

Then start the frontend in another terminal:

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend's API helper includes browser credentials for session-based API calls. Local sign-in also requires a GitHub OAuth App configured with the local callback URL above.

## Production deployment

The current deployment model separates the frontend, backend, database, and inference provider:

- **Frontend:** Vercel, with the project root set to `client/`.
- **Backend:** Render, using a Dockerfile in `backend/`.
- **Database:** Neon PostgreSQL with the `vector` extension enabled.
- **Inference:** NVIDIA-hosted API, called server-side by the backend.
- **Domain:** `heavenlycalamity.tech` for the website and `api.heavenlycalamity.tech` for the API, if those custom domains are configured and verified.

### Vercel environment variable

Set the following in the Vercel project settings and redeploy after changing it:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.heavenlycalamity.tech/api
```

If your API uses a different verified hostname, use that hostname instead.

### Render environment variables

Configure the variables in the backend table above with your production values. For Neon, `DB_URL` must be a JDBC URL, for example:

```text
jdbc:postgresql://YOUR_NEON_HOST/YOUR_DATABASE?sslmode=require
```

Use the exact hostname, database name, username, and password from Neon's connection details. The JDBC URL must begin with `jdbc:postgresql://`; set the username and password separately. A pooled Neon hostname may be appropriate for a hosted backend.

For the custom-domain deployment, the URL variables should match the actual deployed domains:

```env
BACKEND_URL=https://api.heavenlycalamity.tech
FRONTEND_URL=https://www.heavenlycalamity.tech
CORS_ALLOWED_ORIGINS=https://www.heavenlycalamity.tech,https://heavenlycalamity.tech
```

Keep GitHub OAuth's callback URL synchronized with the backend URL:

```text
https://api.heavenlycalamity.tech/login/oauth2/code/github
```

The actual callback must match the hostname configured in `BACKEND_URL` and in the GitHub OAuth App settings. Configure HTTPS session cookies in production. The backend uses cookie-based sessions, so CORS must permit the exact frontend origin and credentials.

### Enable PGVector on Neon

In the Neon SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Confirm the database schema and embedding dimensions agree with the backend configuration before indexing repositories.

## Security notes

- Never commit `.env` files, API keys, OAuth secrets, database credentials, or encryption secrets.
- Set production secrets in Render's environment-variable settings and configure only the public API URL in Vercel.
- Use strong, unique encryption passwords and hexadecimal salts. Spring Security's `Encryptors.delux` requires a hexadecimal salt.
- Keep encryption passwords and salts stable after encrypted values have been stored. Changing them may make existing encrypted values unreadable.
- Do not use the default local database credentials in production.
- Restrict CORS to the exact trusted frontend origins; do not use a wildcard origin with credentialed requests.
- Grant GitHub OAuth only the permissions the application requires, and protect the backend's session and repository authorization boundaries.

## Troubleshooting

### Frontend sends API requests to `localhost:8080`

Set `NEXT_PUBLIC_API_BASE_URL` in the Vercel project settings and create a new frontend deployment. `NEXT_PUBLIC_*` values are embedded into the client bundle at build time.

### Database driver rejects `DB_URL`

Make sure the URL begins with `jdbc:postgresql://`, not `postgresql://` or a full `psql` shell command. Configure `DB_USERNAME` and `DB_PASSWORD` separately.

### Hibernate cannot determine the database dialect

This is often a downstream symptom of a failed database connection. Check the earlier logs for the first HikariCP or PostgreSQL error, then verify the JDBC URL, credentials, TLS requirement, network reachability, and Neon project status.

### Encryption reports a non-hex character

Check `ENCRYPTION_SALT` and `TOKEN_ENCRYPTOR_SALT`. Use only hexadecimal characters (`0-9`, `a-f`, or `A-F`) with no quotes, spaces, or `0x` prefix. Do not rotate salts after encrypted values have been stored unless you have a migration plan.

### GitHub login redirects to `error=session`, `401`, or `403`

Confirm the OAuth callback URL, `BACKEND_URL`, `FRONTEND_URL`, and `CORS_ALLOWED_ORIGINS` match the deployed hosts exactly. In browser developer tools, inspect the `/api/auth/me` request, status, response body, and whether the `DEVPILOT_SESSION` cookie is included. A `401` from this endpoint while logged out is expected.

### Render's root URL shows “No static resource for request '/'”

The backend is an API and may not define a homepage route. Test a real API endpoint instead. For example, `/api/auth/me` requires a valid authenticated session and may return `401` when called while logged out.

## Development notes

- The repository's current GitHub name is `RepoScanner`; the user-facing application is branded **DevPilot**.
- The database initialization script lives at `docker/postgres/init-extensions.sql`.
- The local Docker Compose database publishes port `55432` to avoid requiring PostgreSQL on the host's standard port.
- Do not assume a chat response or citation is correct solely because the model produced it. Check referenced code in the repository.

## Contributing

Issues and pull requests are welcome. For a useful bug report, include the relevant frontend or backend logs, steps to reproduce, and expected behavior. **Redact session cookies, database URLs with credentials, OAuth secrets, NVIDIA API keys, and encryption values before sharing logs.**

## License

No license terms are declared by this README. Add a `LICENSE` file before distributing or reusing the project if you intend to grant others specific rights.
