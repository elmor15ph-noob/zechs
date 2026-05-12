import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="supply_chain")
    # Hypothetical targeted URL for Supply Chain
    asyncio.run(scraper.crawl("https://help.sap.com/docs/SAP_S4HANA_CLOUD?task=supply_chain", max_pages=10))
