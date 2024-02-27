import { chromium } from "playwright";
import { getUserCredentials } from "./getCreds.js";
(async () => {
  const { email, password } = await getUserCredentials();
  const browser = await chromium.launch({
    headless: false,
    viewport: {
      width: 1920,
      height: 1080,
    },
  });

  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto(
    "https://au.unleashedsoftware.com/v2/StockAdjustments/List#status=Parked"
  );

  if (page.url().includes("/v2/Account/LogOn")) {
    // Log in
    await page.waitForSelector("#username");
    await page.type("#username", email);
    await page.type("#password", password);
    await page.click("#btnLogOn");
    await page.waitForNavigation();
    await page.click("button.centerAligned.buttonLink");
  }

  await page.waitForSelector("#StockAdjustmentList_DXMainTable");
  await page.waitForSelector("#StockAdjustmentList_DXDataRow0");

  const links = [];

  for (let i = 0; i <= 14; i++) {
    const rowId = `StockAdjustmentList_DXDataRow${i}`;
    await page.waitForSelector(`#${rowId}`);
    const cell = await page.$(`#${rowId} > td:nth-child(5)`);

    // Extract the text content of the cell
    const cellText = await cell.textContent();

    if (cellText === "Masters Pack App") {
      const linkCell = await page.$(
        `#StockAdjustmentList_DXDataRow${i} > td:nth-child(1) > a`
      );
      const linkHref = await linkCell.getAttribute("href");
      links.push(linkHref);
    }
  }
  console.log("Updating", links);

  for (const link of links) {
    console.log("GOING TO LINK", link);

    await page.goto("https://au.unleashedsoftware.com/" + link, {
      timeout: 2000,
    });
    console.log("Getting TABLEs");

    await page.waitForSelector("#StockAdjustmentLinesList");
    await page.waitForSelector("#StockAdjustmentLinesList_DXMainTable");
    await page.waitForSelector("#StockAdjustmentLinesList_DXDataRow0");
    console.log("GOT ALL TABLEs");
    const numberOfRows = await page.$$eval(
      '[id^="StockAdjustmentLinesList_DXDataRow"]',
      (rows) => rows.length
    );

    for (let i = 0; i < numberOfRows; i++) {
      const rowId = `StockAdjustmentLinesList_DXDataRow${i}`;
      console.log("FINDING LINE ROW", rowId);
      await page.waitForSelector(`#${rowId}`);

      const productCell = await page.$(`#${rowId} > td:nth-child(1)`);
      const productCode = await productCell.textContent();

      console.log("productCode", productCode);
      const productDescCell = await page.$(`#${rowId} > td:nth-child(2)`);
      const productDesc = await productDescCell.textContent();

      console.log("productDesc", productDesc);
      const batchCell = await page.$(`#${rowId} > td:nth-child(5)`);
      const batchNumber = await batchCell.textContent();

      const qtyCell = await page.$(`#${rowId} > td:nth-child(3)`);
      const qtyNumber = await qtyCell.textContent();
      console.log("batchNumber", batchNumber);
      const editCell = await page.waitForSelector(
        `#${rowId} > td:nth-child(6)`,
        {
          timeout: 1000,
        }
      );

      await editCell.click({ timeout: 20000 });
      console.log("finding INPUTTING");
      if (qtyNumber < 0) {
        console.log("ITS A RAW DAWG");
        const x = await page.waitForSelector(".batch-filter >> visible=true");
        console.log(x);
        await page.locator(".batch-filter >> visible=true").fill(batchNumber);

        await page.waitForSelector(".ngRow.even.selected");

        // Once the row is found, locate the input element within it
        // const selectElement = await page.$(
        //   '.ngRow.even.selected input[type="text"]>>visible=true'
        // );
        // await page
        //   .locator(`.ngRow.even.selected input[type="text"]>>visible=true`)
        //   .fill(qtyNumber);
        await page.click("#saveButtonDiv .fm-button.green>>visible=true");
        return;
      } else {
        await page.waitForSelector(
          '.add-batch-form input[ng-model="productBatch.batchNumber"] >> visible=true'
        );
        console.log(" INPUTTING batch");

        await page
          .locator(
            '.add-batch-form input[ng-model="productBatch.batchNumber"] >> visible=true'
          )
          .fill(batchNumber);

        console.log(" finding INPUTTING qty");

        await page.waitForSelector(
          '.add-batch-form input[ng-model="productBatch.selectedQuantity"] >> visible=true'
        );
        console.log(" INPUTTING batch");

        await page
          .locator(
            '.add-batch-form input[ng-model="productBatch.selectedQuantity"] >> visible=true'
          )
          .fill(qtyNumber);

        console.log("clicking addBatch");

        //   const addBatch = await page.waitForSelector("text=Add Batch");
        await page.click(".editor-field.add-batch .fm-button>>visible=true");
        //   await addBatch.click();
        console.log("clicking save");

        //   const saveButton = await page.waitForSelector("text=Save");
        await page.click("#saveButtonDiv .fm-button.green>>visible=true");
        //   await saveButton.click();
      }
    }
  }

  await browser.close();
})();
