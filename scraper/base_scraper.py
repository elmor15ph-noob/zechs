import json
import os
import time
import asyncio
from typing import List
from urllib.parse import urlparse

from playwright.async_api import async_playwright, Browser
from bs4 import BeautifulSoup

BASE_URL = "https://help.sap.com"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
MAX_CONCURRENT_PAGES = 3
RATE_LIMIT_DELAY = 1.0
MAX_RETRIES = 3
BACKOFF_FACTOR = 2.0

class SAPScraper:
    def __init__(self, category_name="general"):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        self.visited_urls = set()
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_PAGES)
        self.category_name = category_name

    async def save_to_json(self, url: str, title: str, content: str):
        parsed_url = urlparse(url)
        path = parsed_url.path.strip("/").replace("/", "_")
        if not path:
            path = "index"
        filename = f"sap_s4hana_{self.category_name}_{path}.json"
        filepath = os.path.join(OUTPUT_DIR, filename)

        data = {
            "url": url,
            "title": title,
            "content": content,
            "timestamp": time.time(),
            "category": self.category_name
        }

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[{self.category_name}] Saved: {filepath}")

    async def process_page(self, browser: Browser, url: str) -> List[str]:
        if url in self.visited_urls:
            return []
        self.visited_urls.add(url)

        async with self.semaphore:
            await asyncio.sleep(RATE_LIMIT_DELAY)
            for attempt in range(MAX_RETRIES):
                try:
                    page = await browser.new_page()
                    response = await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    if response and response.status >= 400:
                        await page.close()
                        return []

                    title = await page.title()
                    html_content = await page.content()

                    soup = BeautifulSoup(html_content, 'html.parser')
                    for script_or_style in soup(["script", "style", "header", "footer", "nav"]):
                        script_or_style.extract()
                    text_content = soup.get_text(separator=' ', strip=True)

                    if text_content:
                        await self.save_to_json(url, title, text_content)

                    links = []
                    hrefs = await page.evaluate('''() => {
                        const links = Array.from(document.querySelectorAll('a'));
                        return links.map(a => a.href);
                    }''')

                    for href in hrefs:
                        if href and href.startswith(BASE_URL) and any(k in href for k in ["SAP_S4HANA_CLOUD", "SAP_S4HANA_CLOUD_PRIVATE_EDITION", "SAP_S4HANA_ON-PREMISE"]):
                            clean_url = href.split('#')[0]
                            if clean_url not in self.visited_urls:
                                links.append(clean_url)

                    await page.close()
                    return links

                except Exception as e:
                    await page.close()
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(RATE_LIMIT_DELAY * (BACKOFF_FACTOR ** attempt))
                    else:
                        return []
        return []

    async def crawl(self, start_url: str, max_pages: int = 10):
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            queue = [start_url]
            pages_processed = 0

            while queue and pages_processed < max_pages:
                batch_size = min(MAX_CONCURRENT_PAGES, len(queue), max_pages - pages_processed)
                current_batch = queue[:batch_size]
                queue = queue[batch_size:]

                tasks = [self.process_page(browser, url) for url in current_batch]
                results = await asyncio.gather(*tasks)

                for new_links in results:
                    if new_links:
                        for link in set(new_links):
                            if link not in queue and link not in self.visited_urls:
                                queue.append(link)
                pages_processed += len(current_batch)
            await browser.close()
            print(f"[{self.category_name}] Crawling finished.")
