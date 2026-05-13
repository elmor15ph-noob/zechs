import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="on_premise")
    asyncio.run(scraper.crawl("https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE", max_pages=10))
