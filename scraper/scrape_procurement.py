import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="procurement")
    # Targeted URLs for Procurement
    start_urls = [
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD?task=procurement",
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD_PRIVATE_EDITION?task=procurement",
        "https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE?task=procurement"
    ]
    asyncio.run(scraper.crawl(start_urls, max_pages=10))
