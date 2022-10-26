import type { NextPage } from "next";
import React, { FormEvent, useState } from "react";

const Home: NextPage = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [sitemap, setSitemap] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/sitemap", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    const json = await res.json();
    if (json.error) {
      setSitemap(json.error);
    } else {
      setSitemap(JSON.stringify(json, null, 2));
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Sitemap Generator</h1>
      <p>Enter a full URL below to generate a recursive sitemap.</p>
      <form onSubmit={handleSubmit} className={loading ? "loading" : ""}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
        />

        <input
          type="submit"
          value="search"
          disabled={loading}
          className="material-symbols-rounded"
        />
      </form>

      <div className="pre-wrapper">
        <pre>{loading ? "loading..." : sitemap}</pre>
      </div>
    </div>
  );
};

export default Home;
