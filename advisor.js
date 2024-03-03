import { chromium } from "playwright";
import { writeFile } from "fs/promises";
import fs from "fs";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    viewport: {
      width: 1920,
      height: 1080,
    },
  });

  const context = await browser.newContext();
  const links = JSON.parse(fs.readFileSync("advisor_names.json", "utf8"));
  // const links = JSON.parse(fs.readFileSync("advisor_names_test.json", "utf8"));

  for (const link of links) {
    console.log("Scraping...", link.name);
    const page = await context.newPage();
    await page.goto(link.link);

    const partnerStatus = await page.evaluate(() => {
      const tagGroup = document.querySelector(
        ".TagGroup__TagSection-sc-1xhwdnt-1"
      );
      if (!tagGroup) return null; // Return null if the tag group is not found

      const tags = tagGroup.querySelectorAll(".Tag__TagHeading-tkc026-2");
      for (const tag of tags) {
        const tagText = tag?.textContent?.trim();
        if (
          tagText.startsWith("Platinum") ||
          tagText.startsWith("Gold") ||
          tagText.startsWith("Silver")
        ) {
          console.log(tagText, tags);
          return tagText; // Return the partner status
        }
      }
      return null; // Return null if no partner status is found
    });
    const advisorDetails = await page.evaluate(() => {
      const profileHero = document.querySelector(
        ".advisors-profile-hero-detailed-info"
      );
      if (!profileHero) return null; // Return null if the profile hero section is not found

      const title = profileHero
        ?.querySelector(".advisors-profile-hero-detailed-info-title")
        ?.textContent?.trim();
      let address = "";
      let contactNumber = "";
      let website = "";

      const infoSub = profileHero.querySelector(
        ".advisors-profile-hero-detailed-info-sub"
      );
      if (infoSub) {
        address = infoSub?.textContent?.trim().split("·")[1]?.trim();
      }

      const contactList = profileHero.querySelector(
        ".advisors-profile-hero-detailed-contact-list"
      );
      if (contactList) {
        const contactItems = contactList.querySelectorAll("li");
        contactItems.forEach((item) => {
          const btnText = item?.textContent?.trim();
          if (btnText.includes("Phone number")) {
            contactNumber = item
              ?.querySelector("a")
              ?.getAttribute("data-phone")
              ?.trim();
          } else if (btnText.includes("View website")) {
            website = item?.querySelector("a")?.getAttribute("href")?.trim();
          }
        });
      }

      return { title, address, contactNumber, website };
    });
    const socialLinks = await page.evaluate(() => {
      const socialBlock = document.querySelector(
        ".advisor-profile-practice-social"
      );
      if (!socialBlock) return null; // Return null if the social block is not found

      const links = [];
      const socialItems = socialBlock.querySelectorAll(
        ".advisor-profile-practice-social-item"
      );
      socialItems.forEach((item) => {
        const linkElement = item.querySelector(
          ".advisor-profile-practice-social-link"
        );
        if (linkElement) {
          const link = linkElement?.getAttribute("href")?.trim();
          const platform = linkElement?.textContent?.trim();
          links.push({ platform, link });
        }
      });

      return links;
    });
    const teamMembers = await page?.evaluate(() => {
      const teamList = document.querySelectorAll(".advisors-profile-team-name");
      const members = [];
      if (teamList) {
        teamList.forEach((member) => {
          const name = member?.textContent?.trim();
          const title = member?.nextElementSibling
            ?.querySelector("strong")
            ?.textContent?.trim();
          members.push({ name, title });
        });
      }
      return members;
    });
    const locations = await page.evaluate(() => {
      const locationItems = document.querySelectorAll(
        ".advisors-profile-locations-list-item"
      );
      const locationDetails = [];

      locationItems.forEach((item) => {
        const city = item
          ?.querySelector(".advisors-profile-locations-list-item-title")
          ?.textContent?.trim();
        const address = item
          ?.querySelector(".advisors-profile-locations-list-item-address")
          ?.textContent?.trim();
        const phoneNumber = item.querySelector(
          ".advisors-profile-locations-list-item-phone a"
        );
        const phone = phoneNumber ? phoneNumber?.textContent?.trim() : "N/A";

        locationDetails.push({ city, address, phone });
      });

      return locationDetails;
    });

    const advisor = {
      title: link.name,
      link: link.link,
      details: advisorDetails,
      address: locations.length > 0 ? locations[0].address : "",
      contactNumber: locations.length > 0 ? locations[0].phone : "",
      website:
        socialLinks?.find((link) => link.platform === "View website")?.link ||
        "",
      socials: socialLinks?.filter((link) => link.platform !== "View website"),
      members: teamMembers,
      locations: locations,
      partnerStatus: partnerStatus,
    };
    const fileExists = fs.existsSync("advisor_details.json");

    if (!fileExists) {
      fs.writeFileSync("advisor_details.json", "[]");
    }

    const fileContent = fs.readFileSync("advisor_details.json", "utf8");

    const advisors = JSON.parse(fileContent);

    advisors.push(advisor);

    fs.writeFileSync("advisor_details.json", JSON.stringify(advisors, null, 2));

    console.log("Advisor details:", advisor);
    await page.close();
  }

  console.log(advisor);
  await browser.close();
})();
