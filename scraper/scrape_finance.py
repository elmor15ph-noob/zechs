import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="finance")
    start_urls = [
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD?task=finance",
        "https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE?task=finance",
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD_PRIVATE_EDITION?task=finance"
    ]
    asyncio.run(scraper.crawl(start_urls, max_pages=10))
