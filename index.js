import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

const WIKI_USERNAME = "Wildspace-gpt@chatgpt";
const WIKI_PASSWORD = "m0an9jo5qnqb8059lgmg6eem6gbj0hu7";
const API_URL = "https://wildspace.miraheze.org/api.php";

// Browser-like headers to get past Cloudflare
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

async function getLoginToken() {
  const res = await fetch(`${API_URL}?action=query&meta=tokens&type=login&format=json`, {
    method: 'GET',
    headers: HEADERS
  });

  const raw = await res.text();
  console.log("🔍 getLoginToken raw response:", raw);

  try {
    const data = JSON.parse(raw);
    const cookie = res.headers.get('set-cookie') || '';
    return { token: data?.query?.tokens?.logintoken, cookie };
  } catch (e) {
    throw new Error("Failed to parse login token response");
  }
}

async function doLogin(token, cookie) {
  const params = new URLSearchParams({
    action: 'login',
    lgname: WIKI_USERNAME,
    lgpassword: WIKI_PASSWORD,
    lgtoken: token,
    format: 'json'
  });

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      ...HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    },
    body: params.toString()
  });

  const raw = await res.text();
  console.log("🔍 doLogin raw response:", raw);

  try {
    const loginCookie = res.headers.get('set-cookie') || '';
    JSON.parse(raw); // just to validate it is actually JSON
    return loginCookie;
  } catch (e) {
    throw new Error("Failed to parse login response");
  }
}

async function fetchExtract(title, cookie) {
  const url = `${API_URL}?action=query&prop=extracts&explaintext=1&format=json&titles=${encodeURIComponent(title)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...HEADERS,
      'Cookie': cookie
    }
  });

  const raw = await res.text();
  console.log(`🔍 fetchExtract raw response for "${title}":`, raw);

  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error("Failed to parse extract response");
  }
}

app.get('/', (req, res) => {
  res.send('Miraheze Wiki Proxy is running.');
});

app.get('/extract', async (req, res) => {
  const title = req.query.title || "Main_Page";

  try {
    const { token, cookie } = await getLoginToken();
    const sessionCookie = await doLogin(token, cookie);
    const result = await fetchExtract(title, sessionCookie);
    res.json(result);
  } catch (err) {
    console.error("❌ Proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Wiki Proxy running on port ${PORT}`);
});
