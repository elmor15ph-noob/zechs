import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="private_cloud")
    asyncio.run(scraper.crawl("https://help.sap.com/docs/SAP_S4HANA_CLOUD_PRIVATE_EDITION", max_pages=10))
