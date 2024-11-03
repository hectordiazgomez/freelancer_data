import puppeteer from 'puppeteer';
import fs from 'fs/promises';

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.freelancer.com/freelancers/united-states', { waitUntil: 'networkidle2' });

    try {
        const removeOnlineUsersButton = await page.$('#selected-online');
        if (removeOnlineUsersButton) {
            await removeOnlineUsersButton.click();
            console.log('Clicked on "Remove Online Users Criteria" button.');
        } else {
            console.log('Button to remove online users not found.');
        }
    } catch (error) {
        console.error('Error clicking the button:', error);
    }

    let allUsernames = [];
    const maxPages = 2000;
    let currentPage = 1;

    const extractUsernames = async () => {
        const usernames = await page.$$eval('.Rating-review', reviews => {
            return reviews.map(review => {
                const userLink = review.querySelector('a[href]');
                const reviewCountText = userLink ? userLink.innerText : '';
                const match = reviewCountText.match(/(\d+)/);
                const reviewCount = match ? parseInt(match[1], 10) : 0;
                return reviewCount > 0 ? userLink.getAttribute('href') : null;
            }).filter(username => username);
        });

        allUsernames.push(...usernames);
    };

    try {
        while (currentPage <= maxPages) {
            await extractUsernames();
            const nextButton = await page.$('ul.Pagination:first-of-type .Pagination-item:last-child a[data-target="pagination"]');
            if (nextButton) {
                await Promise.all([
                    nextButton.click(),
                    page.waitForNavigation({ waitUntil: 'networkidle2' })
                ]);
                currentPage++;
            } else {
                console.log("Next button not found, stopping the loop.");
                break;
            }
        }
    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        try {
            await fs.writeFile('usa_usernames.json', JSON.stringify(allUsernames, null, 2));
            console.log('Usernames saved to usa_usernames.json');
        } catch (writeError) {
            console.error('Error saving file:', writeError);
        }
        await browser.close();
    }
})();