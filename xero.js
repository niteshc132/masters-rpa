import { chromium } from "playwright";
import { writeFile } from "fs/promises";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    viewport: {
      width: 1920,
      height: 1080,
    },
  });

  const context = await browser.newContext();

  const page = await context.newPage();

  const totalPages = 443; // Total number of pages
  const resultsPerPage = 10; // Number of results per page
  let allAdvisorNames = [];

  // Loop through each page
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const url = `https://www.xero.com/nz/advisors/find-advisors/australia/?type=advisors&orderBy=ADVISOR_RELEVANCE&sort=ASC&pageNumber=${pageNumber}`;

    await page.goto(url);

    // Wait for the div elements to be present
    await page.waitForSelector(".advisors-result-card-details");

    // Extract names from each advisor on the current page
    const advisorNames = await page.evaluate(() => {
      const advisorCards = document.querySelectorAll(".advisors-result-card");
      const names = [];
      advisorCards.forEach((card) => {
        const nameElement = card.querySelector(".advisors-result-card-title");
        const linkElement = card.querySelector(".advisors-result-card-link");
        if (nameElement && linkElement) {
          names.push({
            name: nameElement.textContent.trim(),
            link: linkElement.getAttribute("href"),
          });
        }
      });
      return names;
    });

    console.log(`Page ${pageNumber}:`, advisorNames);

    // Push current page's advisor names to the array
    allAdvisorNames.push(...advisorNames);

    // Write data to JSON file after processing each page
    await writeFile(
      "advisor_names_wellington.json",
      JSON.stringify(allAdvisorNames, null, 2)
    );

    // If it's not the last page, navigate to the next page
    if (pageNumber < totalPages) {
      const nextPageNumber = pageNumber + 1;
      console.log(`Navigating to page ${nextPageNumber}`);
    }

    // Add a delay before navigating to the next page (to avoid overwhelming the server)
    await page.waitForTimeout(2000); // 2 seconds delay, adjust as needed
  }

  await browser.close();
})();
