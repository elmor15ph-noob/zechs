import asyncio
from scraper.base_scraper import SAPScraper

async def main():
    scraper = SAPScraper(category_name="sales")
    # Hypothetical targeted URLs for Sales
    targets = ["SAP_S4HANA_CLOUD", "SAP_S4HANA_CLOUD_PRIVATE_EDITION", "SAP_S4HANA_ON-PREMISE"]
    for target in targets:
        await scraper.crawl(f"https://help.sap.com/docs/{target}?task=sales", max_pages=10)

if __name__ == "__main__":
    asyncio.run(main())
