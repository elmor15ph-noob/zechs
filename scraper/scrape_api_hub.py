import asyncio
import json
import os
import time
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

START_URL = "https://api.sap.com/products/SAPS4HANACloud/apis/all"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def extract_api_hub_data():
    """Scrapes the SAP API Business Hub for S/4HANA Cloud APIs."""
    print("Starting SAP API Business Hub scraper...")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # Wait for the complex API hub SPA to load
            await page.goto(START_URL, wait_until="networkidle", timeout=60000)

            # Allow a few extra seconds for API calls to populate the grid
            await asyncio.sleep(5)

            title = await page.title()
            html_content = await page.content()

            soup = BeautifulSoup(html_content, 'html.parser')
            for script_or_style in soup(["script", "style"]):
                script_or_style.extract()
            text_content = soup.get_text(separator=' ', strip=True)

            # Save the API data
            filename = "sap_s4hana_api_hub_all.json"
            filepath = os.path.join(OUTPUT_DIR, filename)

            data = {
                "url": START_URL,
                "title": title,
                "content": "SAP API Business Hub (S/4HANA Cloud) - " + text_content,
                "timestamp": time.time(),
                "category": "api_hub"
            }

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"[api_hub] Saved: {filepath}")

        except Exception as e:
            print(f"Error scraping API Hub: {e}")

        finally:
            await browser.close()
            print("[api_hub] Crawling finished.")

if __name__ == "__main__":
    asyncio.run(extract_api_hub_data())
