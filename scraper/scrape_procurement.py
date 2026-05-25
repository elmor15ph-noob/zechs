import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="procurement")
    # Hypothetical targeted URLs for Procurement
    urls_to_crawl = [
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD?task=procurement",
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD_PRIVATE_EDITION?task=procurement",
        "https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE?task=procurement"
    ]
    for url in urls_to_crawl:
        asyncio.run(scraper.crawl(url, max_pages=10))
