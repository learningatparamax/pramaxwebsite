# Publishing www.pramaxs.com on Azure

| Part | Where it runs | Approx. cost |
|---|---|---|
| Frontend (Next.js) | Azure App Service, Linux **B1** plan | ~$13/month for the plan |
| Backend (FastAPI) | Same App Service plan (a plan can host several apps) | included |
| Database (PostgreSQL) | **Neon** free plan (or Azure Database for PostgreSQL, ~$12+/month) | $0 |
| AI chat | xAI (or another provider) — pay per message, capped by the chat rate limits | usage |

Prices are approximate; confirm in the [Azure pricing calculator](https://azure.microsoft.com/pricing/calculator/).
The free **F1** App Service tier does not support custom domains with HTTPS, so B1 is the minimum.

Names used below — App Service names must be globally unique, so add a suffix if one is taken:

| Thing | Name |
|---|---|
| Resource group | `pramaxs-rg` |
| App Service plan | `pramaxs-plan` |
| Backend app | `pramaxs-api` → `https://pramaxs-api.azurewebsites.net` |
| Frontend app | `pramaxs-web` → `https://pramaxs-web.azurewebsites.net` |

Pick one region for everything, close to your visitors (e.g. **Central India** for India).

## 1. Database — Neon

1. Create a project at [neon.tech](https://neon.tech), database name `pramax`, region close to your Azure region.
2. Copy the connection string (`postgresql://...?sslmode=require`).
3. Load the starter content from your Mac (tables are created automatically):
   ```bash
   cd backend && source .venv/bin/activate
   DATABASE_URL="<neon connection string>" python -m app.seed
   ```

To use Azure Database for PostgreSQL (Flexible Server, Burstable B1ms) instead, create it in the same
resource group, allow access from Azure services, and use its connection string as `DATABASE_URL`.

## 2. App Service plan

Azure portal → **Create a resource → Web App** creates the plan with the first app:

- Resource group: `pramaxs-rg` (create new)
- Name: `pramaxs-api`, Publish: **Code**, Runtime stack: **Python 3.12**, Operating system: **Linux**
- Region: your region
- Linux plan: create new `pramaxs-plan`, pricing plan **Basic B1**

## 3. Backend app (`pramaxs-api`)

**Settings → Configuration → General settings**
- Startup command: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Always on: **On** · HTTPS only: **On**
- SCM Basic Auth Publishing Credentials: **On** (needed for the GitHub deployment below)

**Settings → Environment variables → App settings**

| Name | Value |
|---|---|
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` (Azure installs `requirements.txt`) |
| `WEBSITES_PORT` | `8000` |
| `DATABASE_URL` | Neon connection string |
| `ADMIN_API_KEY` | a long random string (e.g. output of `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`) |
| `XAI_API_KEY` | your xAI key |
| `GROK_MODEL` | `grok-4.5` |
| `ALLOWED_ORIGINS` | `https://www.pramaxs.com,https://pramaxs.com` |

Optional chat limits (defaults shown): `CHAT_LIMIT_PER_MINUTE=10`, `CHAT_LIMIT_PER_DAY=100`, `CHAT_LIMIT_TOTAL_PER_DAY=2000`.

**Monitoring → Health check**: path `/api/health`.

**Overview → Download publish profile** — keep the file for step 5.

## 4. Frontend app (`pramaxs-web`)

**Create a resource → Web App**: name `pramaxs-web`, Publish **Code**, Runtime **Node 22 LTS**, Linux,
same region, and choose the existing plan **`pramaxs-plan`** (no extra plan cost).

**General settings**
- Startup command: `node server.js`
- Always on: **On** · HTTPS only: **On** · SCM Basic Auth Publishing Credentials: **On**

**App settings**

| Name | Value |
|---|---|
| `BACKEND_API_URL` | `https://pramaxs-api.azurewebsites.net` (no trailing slash) |
| `HOSTNAME` | `0.0.0.0` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` (GitHub Actions builds the site) |

**Overview → Download publish profile** — keep it for step 5.

## 5. Automatic deployment from GitHub

The workflow [`.github/workflows/deploy-azure.yml`](.github/workflows/deploy-azure.yml) deploys both
apps whenever `main` changes. In GitHub → repository **Settings → Secrets and variables → Actions**:

| Type | Name | Value |
|---|---|---|
| Secret | `AZURE_BACKEND_PUBLISH_PROFILE` | full contents of the backend publish profile file |
| Secret | `AZURE_FRONTEND_PUBLISH_PROFILE` | full contents of the frontend publish profile file |
| Variable | `AZURE_BACKEND_APP_NAME` | `pramaxs-api` |
| Variable | `AZURE_FRONTEND_APP_NAME` | `pramaxs-web` |

Then promote the code `dev` → `uat` → `main`. Each push to `main` deploys; you can also re-run it
from the **Actions** tab (Deploy to Azure → Run workflow, branch `main`).

## 6. Check the deployment

- `https://pramaxs-api.azurewebsites.net/api/database-health` → `{"database":"connected"}`
- `https://pramaxs-web.azurewebsites.net` → the site, with services and case studies loaded
- `https://pramaxs-web.azurewebsites.net/admin` → sign in with your `ADMIN_API_KEY`

If something fails, **Monitoring → Log stream** on the app shows its output.

## 7. Connect www.pramaxs.com

pramaxs.com's DNS is at **GoDaddy**, and it currently shows a GoDaddy Website Builder site.
Company email uses **Google Workspace**.

> **Do not change or delete** the MX records (`aspmx.l.google.com` …), the SPF TXT record
> (`v=spf1 …`) or the `google-site-verification` TXT record — email and Google verification depend on them.

1. In GoDaddy, disconnect the domain from **Website Builder** (otherwise it keeps controlling the
   website records). The old site goes offline when DNS switches — save anything you need first.
2. Azure → `pramaxs-web` → **Settings → Custom domains → Add custom domain**, domain provider
   "All other", certificate **App Service Managed Certificate**:
   - `www.pramaxs.com` — Azure shows a **CNAME** (`www` → `pramaxs-web.azurewebsites.net`) and a
     **TXT** (`asuid.www` → verification ID).
   - `pramaxs.com` — Azure shows an **A** record (`@` → the app's IP) and a **TXT** (`asuid` → verification ID).
3. GoDaddy → **Domain → DNS → Manage DNS**: replace the existing `A @` and `CNAME www` records with the
   values Azure shows and add the two `asuid` TXT records. Leave every other record as it is.
4. Back in Azure, **Validate → Add** each domain. DNS changes can take from minutes to a few hours;
   Azure issues the free HTTPS certificates once validation passes.
5. Cancel the GoDaddy Website Builder subscription once the new site is live, if you no longer need it.

## 8. After launch

- **Cost alert:** Azure → Cost Management → Budgets → create a monthly budget with an email alert.
- **Backend access (optional):** the browser only talks to the frontend; to stop direct calls to the
  backend, add `pramaxs-api` → Networking → Access restrictions allowing only `pramaxs-web`'s
  outbound IP addresses (listed under `pramaxs-web` → Properties).
- **Content:** manage services, industry solutions, case studies, chat knowledge and leads at
  `https://www.pramaxs.com/admin`.

## Branch → environment

Production deploys from `main`. To give `uat` its own environment later, add a second pair of apps
(or deployment slots, available from the Standard tier) and a separate Neon branch/database.
