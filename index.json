import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

const WIKI_USERNAME = "Wildspace-gpt@chatgpt";
const WIKI_PASSWORD = "m0an9jo5qnqb8059lgmg6eem6gbj0hu7";
const API_URL = "https://wildspace.miraheze.org/api.php";

async function getLoginToken() {
  const res = await fetch(`${API_URL}?action=query&meta=tokens&type=login&format=json`, {
    method: 'GET',
    headers: { 'User-Agent': 'WikiProxy/1.0' }
  });
  const cookie = res.headers.get('set-cookie') || '';
  const data = await res.json();
  return { token: data?.query?.tokens?.logintoken, cookie };
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
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie,
      'User-Agent': 'WikiProxy/1.0'
    },
    body: params.toString()
  });

  const loginCookie = res.headers.get('set-cookie') || '';
  return loginCookie;
}

async function fetchExtract(title, cookie) {
  const url = `${API_URL}?action=query&prop=extracts&explaintext=1&format=json&titles=${encodeURIComponent(title)}`;
  const res = await fetch(url, {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'WikiProxy/1.0'
    }
  });
  return res.json();
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
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Wiki Proxy running on port ${PORT}`);
});
