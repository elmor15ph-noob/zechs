import asyncio
from scraper.base_scraper import SAPScraper

async def main():
    scraper = SAPScraper(category_name="finance")
    urls = [
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD?task=finance",
        "https://help.sap.com/docs/SAP_S4HANA_CLOUD_PRIVATE_EDITION?task=finance",
        "https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE?task=finance"
    ]
    for url in urls:
        await scraper.crawl(url, max_pages=10)

if __name__ == "__main__":
    asyncio.run(main())
