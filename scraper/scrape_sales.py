import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="sales")
    # Hypothetical targeted URLs for Sales
    urls_to_crawl = [
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD?task=sales",
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD_PRIVATE_EDITION?task=sales",
        "https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE?task=sales"
    ]
    for url in urls_to_crawl:
        asyncio.run(scraper.crawl(url, max_pages=10))
