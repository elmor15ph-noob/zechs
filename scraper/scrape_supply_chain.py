import asyncio
from scraper.base_scraper import SAPScraper

if __name__ == "__main__":
    scraper = SAPScraper(category_name="supply_chain")
    # Hypothetical targeted URLs for Supply Chain
    urls = [
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD_PRIVATE_EDITION?task=supply_chain",
        "https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE?task=supply_chain"
    ]
    for url in urls:
        asyncio.run(scraper.crawl(url, max_pages=10))
