import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="finance")
    # Hypothetical targeted URLs for Finance
    urls_to_crawl = [
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD?task=finance",
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD_PRIVATE_EDITION?task=finance",
        "https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE?task=finance"
    ]
    for url in urls_to_crawl:
        asyncio.run(scraper.crawl(url, max_pages=10))
