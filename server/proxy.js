// Minimal proxy to forward license validation requests to the license-server.
// Keeps validation logic server-side and avoids embedding license-server
// configuration directly in the browser.

const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.json());

const LICENSE_SERVER = process.env.LICENSE_SERVER_URL || "http://localhost:8001";

app.post("/api/license/validate", async (req, res) => {
  try {
    const { license_key } = req.body || {};
    if (!license_key) return res.status(400).json({ error: "license_key required" });

    const body = { license_key, site: req.get("origin") || "react-client" };
    const headers = { "Content-Type": "application/json" };

    const upstream = await fetch(`${LICENSE_SERVER}/api/v1/validate`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await upstream.text();
    try {
      const json = JSON.parse(data);
      return res.status(upstream.status).json(json);
    } catch (err) {
      return res.status(upstream.status).send(data);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "proxy_error", message: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`License proxy listening on http://localhost:${port}`));
