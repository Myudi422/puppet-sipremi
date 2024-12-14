const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getConnection } = require('../db');
const moment = require('moment-timezone');

// Tambahkan plugin stealth
puppeteer.use(StealthPlugin());

const LOGIN_URL = "https://www.netflix.com/login";
const CLEAR_COOKIES_URL = "https://www.netflix.com/clearcookies";

function getMySQLTimestamp() {
    const now = moment().tz('Asia/Jakarta');
    return now.format('YYYY-MM-DD HH:mm:ss');
}

async function saveCookiesToDatabase(website, cookieData, platform = 'Netflix', server = 'Official', timestamp, kode) {
    const connection = await getConnection();
    const validation = 1;

    try {
        const checkQuery = `SELECT * FROM cookies WHERE website = ? AND platform = ?`;
        const [results] = await connection.execute(checkQuery, [website, platform]);

        if (results.length > 0) {
            const updateQuery = `UPDATE cookies SET cookie_data = ?, timestamp = ?, server = ?, validasi = ?, kode = ? WHERE website = ? AND platform = ?`;
            await connection.execute(updateQuery, [JSON.stringify(cookieData), timestamp, server, validation, kode, website, platform]);
            console.log(`Cookies updated in the database for website ${website}.`);
        } else {
            const insertQuery = `INSERT INTO cookies (website, cookie_data, timestamp, platform, server, validasi, kode) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            await connection.execute(insertQuery, [website, JSON.stringify(cookieData), timestamp, platform, server, validation, kode]);
            console.log(`Cookies saved to the database for website ${website}.`);
        }
    } catch (error) {
        console.error("Error while saving cookies to the database:", error);
        throw error;
    } finally {
        connection.release();
    }
}
async function importNetflixCookie(credentials, selectedServer) {
    let browser;
    try {
        console.log("Launching browser...");
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: false,
            timeout: 60000 // Increase the navigation timeout to 60 seconds
        });

        const page = await browser.newPage();
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        await page.setUserAgent(userAgent);

        console.log("Navigating to Netflix login page...");
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

        console.log("Waiting for email input field...");
        await page.waitForSelector("input[name='userLoginId']", { visible: true, timeout: 20000 });
        console.log("Typing email...");
        await page.type("input[name='userLoginId']", credentials.email);

        console.log("Waiting for password input field...");
        await page.waitForSelector("input[name='password']", { visible: true, timeout: 20000 });
        console.log("Typing password...");
        await page.type("input[name='password']", credentials.password);

        console.log("Waiting for login button...");
        const loginButton = await page.waitForSelector("button[data-uia='login-submit-button']", { visible: true, timeout: 20000 });
        console.log("Clicking login button...");
        await loginButton.click();

        console.log("Waiting for navigation...");
        await page.waitForNavigation({ waitUntil: "networkidle2" });

        if (page.url().includes("/browse")) {
            console.log("Fetching cookies...");
            const cookies = await page.cookies();
            const timestamp = getMySQLTimestamp();

            // Combine profile information into kode
            const kode = credentials.profile;

            await saveCookiesToDatabase(LOGIN_URL, cookies, 'Netflix', selectedServer, timestamp, kode);


            console.log("Process completed successfully.");
            return 'Netflix cookie imported successfully.';
        } else {
            throw new Error("Login failed or unexpected page.");
        }
    } catch (error) {
        console.error("Error while processing Netflix website:", error);
        throw error;
    } finally {
        if (browser) {
            console.log("Closing browser...");
            await browser.close();
        }
    }
}


module.exports = { importNetflixCookie };
