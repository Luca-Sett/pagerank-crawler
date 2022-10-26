import type { NextApiRequest, NextApiResponse } from "next";
import { load } from "cheerio";

interface Webpage {
  title: string;
  links: string[];
}

type Website = Record<string, Webpage>;

const getWebpage = async (
  baseUrl: string,
  pageUrl: string
): Promise<Webpage | { error: any }> => {
  try {
    const response = await fetch(baseUrl + pageUrl);
    const html = await response.text();

    const $ = load(html);

    const title = $("title").text();

    const linksWithDuplicates = $("a")
      .map((_, el) => $(el).attr("href"))
      .get()
      .filter(
        (link) =>
          (link.startsWith("/") || link.startsWith(baseUrl)) &&
          !link.includes("#") &&
          !link.includes("?")
      )
      .map((link) =>
        link.startsWith(baseUrl) ? link.replace(baseUrl, "") : link
      )
      .filter((link) => !link.includes(".") && link.length > 0);

    const links = [...new Set(linksWithDuplicates)];

    return { title, links };
  } catch (error) {
    return { error };
  }
};

export default async (
  req: NextApiRequest,
  res: NextApiResponse<Website | { error: any }>
) => {
  const startTime = Date.now();
  const { url } = JSON.parse(req.body);

  if (!url) {
    res.status(400).json({
      error: "You haven't provided a URL to crawl! :/",
    });
    return;
  }

  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    res.status(400).json({
      error: "Don't forget to include 'https://' or 'http://' in your URL :)",
    });
    return;
  }

  const website: Record<string, Webpage> = {};

  const crawl = async (baseUrl: string, pageUrl: string, depth: number) => {
    const page = await getWebpage(baseUrl, pageUrl);

    if ("error" in page) {
      console.log(page.error);

      res.status(400).json({ error: page.error });
      return;
    }

    website[pageUrl] = page;

    if (depth === -1) {
      for (const link of page.links) {
        if (!website[link]) await crawl(baseUrl, link, depth);
      }
      // await Promise.all(
      //   page.links
      //     .filter((link) => !website[link])
      //     .map((link) => crawl(baseUrl, link, depth))
      // );
    } else {
      depth--;
      if (depth > 0)
        for (const link of page.links)
          if (!website[link]) await crawl(baseUrl, link, depth);
    }
  };

  await crawl(url, "/", -1);
  const endTime = Date.now();
  console.log(`Crawled ${url} in ${endTime - startTime}ms`);

  res.status(200).json(website);
};
