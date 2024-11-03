import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const USERNAME = '';
const PASSWORD = '';
const START_INDEX = 1899;
const END_INDEX = 1919;
const PROJECTS_FILE = 'projects_details.json';

const saveProgress = async (data) => {
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(data, null, 2));
};

const loadExistingData = async () => {
    try {
        const data = await fs.readFile(PROJECTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('No existing file found, starting fresh');
        return [];
    }
};

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let lastScrollHeight = 0;
            const timer = setInterval(() => {
                const modalContainer = document.querySelector('.ModalContainer[data-active="true"]');
                if (!modalContainer) {
                    clearInterval(timer);
                    resolve();
                    return;
                }

                modalContainer.scrollBy(0, 100);
                const currentScrollHeight = modalContainer.scrollHeight - modalContainer.scrollTop;
                if (lastScrollHeight === currentScrollHeight) {
                    clearInterval(timer);
                    resolve();
                    return;
                }
                lastScrollHeight = currentScrollHeight;
            }, 100);
        });
    });
}

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await page.goto('https://www.freelancer.com/login', { waitUntil: 'networkidle2' });
        await page.type('#emailOrUsernameInput', USERNAME);
        await page.type('#passwordInput', PASSWORD);
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);

        const usernamesData = await fs.readFile('cleaned_usernames.json', 'utf8');
        const allUsernames = JSON.parse(usernamesData);
        const usernames = allUsernames.slice(START_INDEX - 1, END_INDEX);

        const allProjects = await loadExistingData();
        const processedUsernames = new Set(allProjects.map(p => p.username));

        for (let username of usernames) {
            if (processedUsernames.has(username)) {
                console.log(`Skipping already processed user: ${username}`);
                continue;
            }

            console.log(`Processing user: ${username}`);
            const userProjects = {
                username: username,
                projectDetails: []
            };

            try {
                await page.goto(`https://www.freelancer.com/u/${username}`, { waitUntil: 'networkidle2' });
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    await page.waitForSelector('div.ShowMoreCTA fl-button button.ButtonElement', { timeout: 5000 });

                    await page.evaluate(() => {
                        const button = document.querySelector('div.ShowMoreCTA fl-button button.ButtonElement');
                        if (button && button.innerText.includes('Show all reviews')) {
                            button.click();
                        }
                    });
                    await page.waitForSelector('.ModalContainer[data-active="true"]', { timeout: 5000 });
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.log(`No reviews button for user ${username}`);
                    allProjects.push(userProjects);
                    await saveProgress(allProjects);
                    continue;
                }
                await autoScroll(page);
                await new Promise(resolve => setTimeout(resolve, 2000));

                const reviews = await page.$$('fl-list-item fl-review-card');

                for (let review of reviews) {
                    try {
                        const projectTitle = await review.$eval('fl-link a.LinkElement', el => el.textContent.trim());
                        const projectPrice = await review.$eval('fl-text .NativeElement span:last-child', el => el.textContent.trim());
                        const reviewText = await review.$eval('.Body fl-text:nth-child(3) .NativeElement', el => el.textContent.trim());
                        const reviewDate = await review.$eval('fl-relative-time .NativeElement', el => el.textContent.trim());

                        userProjects.projectDetails.push({
                            title: projectTitle,
                            price: projectPrice,
                            review: reviewText,
                            date: reviewDate
                        });
                    } catch (error) {
                        console.log(`Error extracting review data for ${username}:`, error);
                        continue;
                    }
                }

                allProjects.push(userProjects);
                await saveProgress(allProjects);
                console.log(`Completed processing user: ${username}`);

            } catch (error) {
                console.error(`Error processing user ${username}:`, error);
                allProjects.push(userProjects);
                await saveProgress(allProjects);
            }
        }

        await browser.close();
        console.log('Scraping completed successfully');

    } catch (error) {
        console.error('Fatal error:', error);
    }
})();