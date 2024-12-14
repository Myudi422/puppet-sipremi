const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { getConnection } = require('../db');
const moment = require('moment-timezone');

puppeteer.use(StealthPlugin());

const LOGIN_URL = "https://pngtree.com/login/gologin?type=gg";
const MAIN_URL = "https://pngtree.com/";

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2919.83 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2866.71 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux i686 on x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2820.59 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2762.73 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2656.18 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.155 Safari/537.36'
];

function getMySQLTimestamp() {
    const now = moment().tz('Asia/Jakarta');
    return now.format('YYYY-MM-DD HH:mm:ss');
}

async function saveCookiesToDatabase(website, cookieData, platform = 'pngtree', server = 'Official', timestamp) {
    const connection = await getConnection();
    const validation = 1;

    try {
        const checkQuery = `SELECT * FROM cookies WHERE website = ? AND platform = ?`;
        const [results] = await connection.execute(checkQuery, [website, platform]);

        if (results.length > 0) {
            const updateQuery = `UPDATE cookies SET cookie_data = ?, timestamp = ?, server = ?, validasi = ? WHERE website = ? AND platform = ?`;
            await connection.execute(updateQuery, [JSON.stringify(cookieData), timestamp, server, validation, website, platform]);
            console.log(`Cookies updated in the database for website ${website}.`);
        } else {
            const insertQuery = `INSERT INTO cookies (website, cookie_data, timestamp, platform, server, validasi) VALUES (?, ?, ?, ?, ?, ?)`;
            await connection.execute(insertQuery, [website, JSON.stringify(cookieData), timestamp, platform, server, validation]);
            console.log(`Cookies saved to the database for website ${website}.`);
        }
    } catch (error) {
        console.error("Error while saving cookies to the database:", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function importPNGTreeCookie(credentials, selectedServer) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                "--disable-blink-features=AutomationControlled",
                "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            ],
        });

        const page = await browser.newPage();
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        await page.setUserAgent(userAgent);

        console.log("Navigating to Login page...");
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

        console.log("Waiting for email input field...");
        await page.waitForSelector("input[name='identifier']", { visible: true, timeout: 20000 });
        console.log("Typing email...");
        await page.type("input[name='identifier']", credentials.email);

        console.log("Waiting for Next button...");
        const nextButtonEmail = await page.waitForSelector("#identifierNext", { visible: true, timeout: 20000 });
        console.log("Clicking Next button for email...");
        await nextButtonEmail.click();

        console.log("Waiting for password input field...");
        await page.waitForSelector("input[name='Passwd']", { visible: true, timeout: 20000 });
        console.log("Typing password...");
        await page.type("input[name='Passwd']", credentials.password);

        console.log("Waiting for 1 second...");
        await page.waitForTimeout(1000);

        console.log("Clicking 'Next' button for password...");
        await page.evaluate(() => {
            document.querySelector("#passwordNext").click();
        });
        console.log("Clicked 'Next' button for password.");

        console.log("Waiting for 5 seconds...");
        await page.waitForTimeout(9000);

        console.log("Fetching cookies...");
        const cookies = await page.cookies();
        const timestamp = getMySQLTimestamp();

        await saveCookiesToDatabase(MAIN_URL, cookies, "pngtree", selectedServer, timestamp);

        console.log("Process completed successfully.");
        return 'PNGTree cookie imported successfully.';
    } catch (error) {
        console.error("Error while processing PNGTree website:", error);
        throw error;
    } finally {
        if (browser) {
            console.log("Closing browser...");
            await browser.close();
        }
    }
}

module.exports = { importPNGTreeCookie };
