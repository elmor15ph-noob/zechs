import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="sales")
    # Targeted URLs for Sales across SAP solutions
    start_urls = [
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD?task=sales",
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD_PRIVATE_EDITION?task=sales",
        "https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE?task=sales"
    ]
    for url in start_urls:
        asyncio.run(scraper.crawl(url, max_pages=10))
