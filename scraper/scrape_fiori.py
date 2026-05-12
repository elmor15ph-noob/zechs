import asyncio
import json
import os
import time
from urllib.parse import urlparse
from playwright.async_api import async_playwright, Browser
from bs4 import BeautifulSoup

# Fiori Apps Library is heavily dynamically rendered (SAPUI5)
START_URL = "https://fioriappslibrary.hana.ondemand.com/sap/fix/externalViewer/"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def extract_fiori_data():
    """Scrapes the Fiori Apps Reference Library for S/4HANA apps."""
    print("Starting Fiori Apps Reference Library scraper...")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # The Fiori library takes a significant amount of time to load the UI5 components
            await page.goto(START_URL, wait_until="networkidle", timeout=60000)

            # Since Fiori Library is an interactive UI5 app, traditional crawling is hard.
            # Here we extract the initial loaded documentation/text as a starting point.
            # A full crawl would require deeply clicking through the UI5 tree elements,
            # which is complex. For now, we capture the landing content and available links.

            title = await page.title()
            html_content = await page.content()

            soup = BeautifulSoup(html_content, 'html.parser')
            for script_or_style in soup(["script", "style"]):
                script_or_style.extract()
            text_content = soup.get_text(separator=' ', strip=True)

            # Save the root data
            filename = "sap_s4hana_fiori_library_root.json"
            filepath = os.path.join(OUTPUT_DIR, filename)

            data = {
                "url": START_URL,
                "title": title,
                "content": "Fiori Apps Reference Library - " + text_content,
                "timestamp": time.time(),
                "category": "fiori_library"
            }

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"[fiori] Saved: {filepath}")

        except Exception as e:
            print(f"Error scraping Fiori Library: {e}")

        finally:
            await browser.close()
            print("[fiori] Crawling finished.")

if __name__ == "__main__":
    asyncio.run(extract_fiori_data())
