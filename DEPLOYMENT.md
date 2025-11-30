# Deployment Guide

This guide covers deploying the Food Nutrition Sankey Diagram to:
1. **GitHub Pages** (free static hosting)
2. **Cloudflare Workers** (free API proxy)

---

## Step 1: Deploy the Cloudflare Worker (API Proxy)

The Cloudflare Worker proxies requests to the USDA API and keeps your API key secret.

### Prerequisites
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- Node.js installed locally

### Steps

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Navigate to the worker directory**
   ```bash
   cd cloudflare-worker
   ```

4. **Add your USDA API key as a secret**
   ```bash
   wrangler secret put USDA_API_KEY
   ```
   When prompted, paste your USDA API key.

5. **Deploy the worker**
   ```bash
   wrangler deploy
   ```

6. **Note your worker URL**
   After deployment, you'll see something like:
   ```
   Published sankey-usda-proxy (1.0.0)
   https://sankey-usda-proxy.YOUR-SUBDOMAIN.workers.dev
   ```
   Copy this URL!

---

## Step 2: Update the Frontend with Your Worker URL

1. **Edit `docs/js/sankey.js`**
   
   Find this line at the top:
   ```javascript
   const API_BASE_URL = 'https://your-worker-name.your-subdomain.workers.dev';
   ```
   
   Replace it with your actual worker URL from Step 1:
   ```javascript
   const API_BASE_URL = 'https://sankey-usda-proxy.YOUR-SUBDOMAIN.workers.dev';
   ```

2. **Commit the change**
   ```bash
   git add docs/js/sankey.js
   git commit -m "Update API URL for production"
   ```

---

## Step 3: Deploy to GitHub Pages

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repo on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select:
     - Branch: `main`
     - Folder: `/docs`
   - Click **Save**

3. **Wait for deployment**
   GitHub will build and deploy your site. After a few minutes, your site will be live at:
   ```
   https://YOUR-USERNAME.github.io/sankey-chart/
   ```

---

## Testing Locally

To test the static site locally before deploying:

```bash
cd docs
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser.

**Note:** For local testing, you'll need to either:
- Temporarily set `API_BASE_URL = ''` and run the Flask backend (`python main.py`)
- Or use your deployed Cloudflare Worker URL

---

## Costs

Both services are **free** for typical usage:

| Service | Free Tier |
|---------|-----------|
| GitHub Pages | Unlimited for public repos |
| Cloudflare Workers | 100,000 requests/day |
| USDA API | 1,000 requests/hour |

---

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console, make sure your Cloudflare Worker is correctly setting the `Access-Control-Allow-Origin` header.

### API Key Issues
If searches fail, verify your USDA API key:
```bash
cd cloudflare-worker
wrangler secret list
```

### Worker Not Updating
Force a new deployment:
```bash
wrangler deploy --force
```

