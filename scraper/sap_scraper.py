import json
import os
import time
import asyncio
from typing import List, Dict, Any
from urllib.parse import urljoin, urlparse

from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup

# Constants
BASE_URL = "https://help.sap.com"
START_URL = "https://help.sap.com/docs/SAP_S4HANA_CLOUD"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
MAX_CONCURRENT_PAGES = 3
RATE_LIMIT_DELAY = 1.0  # seconds between requests
MAX_RETRIES = 3
BACKOFF_FACTOR = 2.0

class SAPScraper:
    def __init__(self):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        self.visited_urls = set()
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_PAGES)

    async def extract_text_from_html(self, html_content: str) -> str:
        """Extract plain text from HTML content using BeautifulSoup."""
        soup = BeautifulSoup(html_content, 'html.parser')

        # Remove script and style elements
        for script_or_style in soup(["script", "style", "header", "footer", "nav"]):
            script_or_style.extract()

        # Extract text
        text = soup.get_text(separator=' ', strip=True)
        return text

    async def save_to_json(self, url: str, title: str, content: str):
        """Save the extracted data as structured JSON."""
        # Create a safe filename from the URL
        parsed_url = urlparse(url)
        path = parsed_url.path.strip("/").replace("/", "_")
        if not path:
            path = "index"
        filename = f"sap_s4hana_{path}.json"
        filepath = os.path.join(OUTPUT_DIR, filename)

        data = {
            "url": url,
            "title": title,
            "content": content,
            "timestamp": time.time()
        }

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"Saved: {filepath}")

    async def process_page(self, browser: Browser, url: str) -> List[str]:
        """Process a single page, extract content, and return found links."""
        if url in self.visited_urls:
            return []

        self.visited_urls.add(url)

        async with self.semaphore:
            # Implement rate limiting delay
            await asyncio.sleep(RATE_LIMIT_DELAY)

            for attempt in range(MAX_RETRIES):
                try:
                    page = await browser.new_page()
                    print(f"Scraping: {url} (Attempt {attempt + 1})")

                    # Add timeout and wait until network is idle
                    response = await page.goto(url, wait_until="domcontentloaded", timeout=30000)

                    if response and response.status >= 400:
                        print(f"Error {response.status} for URL: {url}")
                        await page.close()
                        return []

                    # Extract title
                    title = await page.title()

                    # Extract content
                    html_content = await page.content()
                    text_content = await extract_text_from_html(html_content)

                    if text_content:
                        await self.save_to_json(url, title, text_content)

                    # Find links
                    links = []
                    hrefs = await page.evaluate('''() => {
                        const links = Array.from(document.querySelectorAll('a'));
                        return links.map(a => a.href);
                    }''')

                    for href in hrefs:
                        if href and href.startswith(BASE_URL) and "SAP_S4HANA_CLOUD" in href:
                            # Remove fragments
                            clean_url = href.split('#')[0]
                            if clean_url not in self.visited_urls:
                                links.append(clean_url)

                    await page.close()
                    return links

                except Exception as e:
                    print(f"Error processing {url}: {str(e)}")
                    await page.close()

                    if attempt < MAX_RETRIES - 1:
                        sleep_time = RATE_LIMIT_DELAY * (BACKOFF_FACTOR ** attempt)
                        print(f"Retrying in {sleep_time} seconds...")
                        await asyncio.sleep(sleep_time)
                    else:
                        print(f"Max retries reached for {url}. Skipping.")
                        return []

    async def crawl(self, start_url: str, max_pages: int = 10):
        """Crawl starting from the given URL up to max_pages."""
        async with async_playwright() as p:
            # Launch browser (headless by default)
            browser = await p.chromium.launch()

            queue = [start_url]
            pages_processed = 0

            while queue and pages_processed < max_pages:
                # Process a batch of URLs concurrently
                batch_size = min(MAX_CONCURRENT_PAGES, len(queue), max_pages - pages_processed)
                current_batch = queue[:batch_size]
                queue = queue[batch_size:]

                tasks = [self.process_page(browser, url) for url in current_batch]
                results = await asyncio.gather(*tasks)

                # Add new links to queue
                for new_links in results:
                    if new_links:
                        # Add only links not already in queue or visited
                        for link in set(new_links):
                            if link not in queue and link not in self.visited_urls:
                                queue.append(link)

                pages_processed += len(current_batch)

            await browser.close()
            print(f"Crawling finished. Processed {pages_processed} pages.")

# Helper function defined outside class to be used in evaluate if needed,
# but calling the class method is preferred. Fixing the reference:
async def extract_text_from_html(html_content: str) -> str:
    soup = BeautifulSoup(html_content, 'html.parser')
    for script_or_style in soup(["script", "style", "header", "footer", "nav"]):
        script_or_style.extract()
    return soup.get_text(separator=' ', strip=True)

if __name__ == "__main__":
    # Example usage: limit to 5 pages for testing/demonstration
    scraper = SAPScraper()
    asyncio.run(scraper.crawl(START_URL, max_pages=5))
