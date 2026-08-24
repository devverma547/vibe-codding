# SiteProof

**SiteProof** is an AI-powered Web Quality & Audit Engine. It automatically scans your website, analyzes its performance and SEO, and uses advanced AI to give you clear, actionable feedback to improve your site.

## What it does
1. **Performance & SEO Scans**: Uses Google PageSpeed Insights to check how fast and SEO-friendly your site is.
2. **AI Analysis**: Uses NVIDIA's powerful AI models to review your site's content and design, giving you personalized advice on how to improve.
3. **Dashboard & History**: Keeps track of all your past scans so you can measure your progress over time.
4. **Secure Login**: Uses Google OAuth and Supabase to keep your data private and secure.

## The Scan Flow (How it Works)
When you run a scan on SiteProof:
1. You enter a website URL into the dashboard.
2. We ask Google PageSpeed Insights for real-time performance, accessibility, and SEO data.
3. We securely send that data to an AI model (running behind the scenes on Netlify Functions).
4. The AI returns a smart, human-readable summary of exactly what you need to fix.
5. Everything is instantly saved to your Supabase database so you can view the report later.

---

## How to Run it Locally

Getting the project running on your own computer is simple.

1. **Install Dependencies:**
   Open your terminal in the project folder and run:
   ```bash
   npm install
   ```

2. **Start the App:**
   ```bash
   npm run dev
   ```

3. Open your browser and go to `http://localhost:5173`.

---

## Environment Variables
To make everything work, the app needs a few secret keys to talk to Google and Supabase. 

1. Copy the `.env.example` file and rename the copy to `.env`.
2. Fill in the blanks in your new `.env` file. 

**Important: Never share your `.env` file or upload it to GitHub!**

### Required Keys in your `.env` file:
*   `VITE_SUPABASE_URL`: Your Supabase project URL.
*   `VITE_SUPABASE_ANON_KEY`: Your Supabase public API key.
*   `VITE_PAGESPEED_API_KEY`: Your Google PageSpeed API Key.
*   `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (for logging in).
*   `VITE_GOOGLE_REDIRECT_URI`: Should be `http://localhost:5173/auth/callback` for local development.

---

## Supabase Setup (Database & Logins)
Supabase acts as our database and handles user logins.
1. Create a new project at [Supabase](https://supabase.com/).
2. Go to **Project Settings > API** to find your `URL` and `anon` key. Paste these into your local `.env` file.
3. Go to **Authentication > Providers** and enable **Google**. (You will need to create a Google Cloud Project to get a Client ID and Secret).
4. Add the `VITE_GOOGLE_CLIENT_ID` to your local `.env` file.

---

## Netlify Setup (AI & Secure Backend)
We use Netlify to host our server-side code (called Netlify Functions). This is where the AI processing happens, which keeps our most sensitive API keys safe from the public eye.

1. Create an account on [Netlify](https://www.netlify.com/).
2. Connect your GitHub repository to Netlify to automatically deploy your site.
3. In your Netlify Dashboard, go to **Site Configuration > Environment variables**.
4. Add the following **secret** variables directly into the Netlify dashboard (do *not* put these in your local `.env` file):
   *   `NVIDIA_API_KEY`: Your key from build.nvidia.com to run the AI models.
   *   `NVIDIA_MODEL`: The AI model to use (e.g., `deepseek-ai/deepseek-v4-flash-0731`).
   *   `GITHUB_TOKEN`: (Optional but recommended) A personal access token to prevent rate limits if your app talks to GitHub.
