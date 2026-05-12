import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="finance")
    # Hypothetical targeted URL for Finance
    asyncio.run(scraper.crawl("https://help.sap.com/docs/SAP_S4HANA_CLOUD?task=finance", max_pages=10))
