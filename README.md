# Vertex Unity: deploy on Vercel (step by step)

A static front end (plain HTML, CSS and JavaScript, no build step) + **one** Vercel serverless function (`api/ai.js`, the Vertex AI coach) + **Supabase** (sign-in, saved data, community chat, private file storage).

Total time: about 25 minutes. Everything below is free to start.

```
index.html              the app shell
assets/styles.css       the glass design system
assets/config.js        <- you paste your Supabase keys here
assets/js/*.js          app code (views, store, data logic, Supabase layer)
assets/data/*.json      the data source: universities, scholarships, majors, essays, guides
scripts/generate_data.py   edit the data tables, run it, JSON is rebuilt
supabase/schema.sql     database tables + security rules + storage bucket
api/ai.js               Vertex AI endpoint (Claude API)
vercel.json             headers / caching
```

## 0. Try it on your computer first (optional, 1 minute)

```bash
cd vertex-unity
python3 -m http.server 5173
# open http://localhost:5173
```
With `config.js` empty the app runs in **demo mode**: everything works and is saved in your browser only. Vertex AI needs the deployed `/api/ai` function.

## 1. Copy your two images from the old site

I could not download them for you. Save these two files into the `assets/` folder:

- https://vertex-unity.netlify.app/assets/campus.jpg  ->  `assets/campus.jpg`
- https://vertex-unity.netlify.app/assets/emblem-128.webp  ->  `assets/emblem-128.webp`

(Right-click -> Save image as. Do this before the Netlify site goes away. Without them the app still works and shows a gradient and a "V" logo.)

Tip: keep `campus.jpg` under about 400 KB (resize to 1920 px wide) so you do not burn bandwidth.

## 2. Create the Supabase project (free)

1. Go to https://supabase.com -> **New project**. Pick any name and a strong database password, region close to your users (Frankfurt is fine for Uzbekistan).
2. When it is ready open **SQL Editor -> New query**, paste all of `supabase/schema.sql`, click **Run**. This creates the tables, the security rules and the private `user-files` bucket.
3. Open **Project Settings -> API**. Copy:
   - **Project URL**
   - **anon public** key (safe to publish; the security rules protect the data)
4. Paste both into `assets/config.js`:
   ```js
   SUPABASE_URL: "https://xxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJ...",
   ```
5. **Authentication -> Providers -> Email**: leave enabled. For quick testing you can turn off "Confirm email".

> Your old Supabase project used different tables, so old accounts and chat history do not move over automatically. Use this new project.

## 3. Put the code on GitHub

1. Create a new repository on https://github.com (private is fine).
2. Upload the whole `vertex-unity` folder (GitHub web: **Add file -> Upload files**, drag the contents in), or:
   ```bash
   git init && git add . && git commit -m "Vertex Unity" 
   git branch -M main && git remote add origin https://github.com/YOU/vertex-unity.git && git push -u origin main
   ```

## 4. Deploy on Vercel

1. https://vercel.com -> **Sign up with GitHub** -> **Add New -> Project** -> import your repository.
2. **Framework Preset: Other**. Leave Build Command and Output Directory empty (there is no build step). Root Directory stays `./`.
3. Open **Environment Variables** and add (needed for Vertex AI):
   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | key from https://console.anthropic.com (**Settings -> API keys**) |
   | `SUPABASE_URL` | same Project URL (so only signed-in students can use the AI) |
   | `SUPABASE_ANON_KEY` | same anon key |
   | `ANTHROPIC_MODEL` | optional, default `claude-sonnet-5-5` |
4. Click **Deploy**. You get `https://your-project.vercel.app`.

> Set a monthly spend limit in the Anthropic console so AI usage can never surprise you.

## 5. Tell Supabase about the new address (login breaks without this)

Supabase -> **Authentication -> URL Configuration**:
- **Site URL**: `https://your-project.vercel.app`
- **Redirect URLs**: add `https://your-project.vercel.app` and `https://your-project.vercel.app/**` (and `http://localhost:5173` for local testing)

## 6. Test checklist

1. Open the site -> **Open app** -> **Create account** -> sign in.
2. Fill in the "Tell us your goals" box. Home shows universities that fit you.
3. Universities -> open one -> **Set as dream school** -> check Applications and Calendar.
4. Channels -> send a message (open a second browser to see real-time chat).
5. Files -> upload a PDF.
6. Vertex AI -> ask a question. If it says "not signed in" or fails, recheck the three env variables and **redeploy** (Vercel only reads new variables on the next deployment).

## 7. Custom domain (optional)

Vercel -> Project -> **Settings -> Domains** -> add your domain and follow the DNS instructions. Then add that domain to the Supabase redirect URLs too.

## Updating the data

The catalogue lives in `scripts/generate_data.py` (universities, scholarships, majors, essay examples, country guides).

```bash
# edit the tables in scripts/generate_data.py, then:
python3 scripts/generate_data.py
git add . && git commit -m "Update data" && git push     # Vercel redeploys automatically
```

Students can also fix numbers inside the app on **Data Health**. Those fixes are saved to Supabase and override the JSON for everyone. To allow only admins, edit the two `catalog_overrides` policies in `schema.sql` (comment included).

### Important: verify the data before you rely on it
The figures (tuition, living costs, IELTS minimums, deadlines, acceptance rates, scholarship details) were written from general knowledge and rounded. **They are approximate and some will be out of date.** Check each against the official site, especially deadlines and scholarship calls, before real students depend on them. The app says "approximate" everywhere, and every university and scholarship has an official link. 98 of the 205 universities have full data; the rest show "Details coming" until you fill them in.

## Vercel Hobby plan notes

- Free tier is for personal / non-commercial projects, with monthly bandwidth limits. If the app becomes a business or gets very popular, move to Pro or use Cloudflare Pages (the front end is plain static files; only `api/ai.js` would need porting).
- The wallpaper is the heaviest file. Keep it small and it is cached for a year (`vercel.json`).

## Troubleshooting

| Problem | Fix |
|---|---|
| Page says "Could not load data" | You opened `index.html` by double-click. Use a server (Vercel, or `python3 -m http.server`). |
| Login screen appears but sign-up does nothing | Supabase URL/key missing or wrong in `config.js`; check the browser console. |
| "Invalid redirect" after email confirmation | Step 5 (redirect URLs). |
| Vertex AI: "ANTHROPIC_API_KEY is not set" | Add the env variable, then **Redeploy**. |
| Vertex AI: "Please sign in" | `SUPABASE_URL` / `SUPABASE_ANON_KEY` env vars must match `config.js`. |
| Chat does not update live | Re-run `schema.sql` (it adds the messages table to realtime). |
| Uploads fail | Re-run `schema.sql` (creates the `user-files` bucket and its rules). |
