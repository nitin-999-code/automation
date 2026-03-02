require('dotenv').config();
const axios = require('axios');

// Configuration
const config = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    filePath: 'data/log.txt'
};

/**
 * Validates that all required configuration values are present.
 */
function validateConfig() {
    const missing = [];
    if (!config.token) missing.push('GITHUB_TOKEN');
    if (!config.owner) missing.push('GITHUB_OWNER');
    if (!config.repo) missing.push('GITHUB_REPO');

    if (missing.length > 0) {
        console.error(`❌ Error: Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please ensure these are set in your .env file or environment.');
        process.exit(1);
    }
}

/**
 * Creates an authenticated axios instance for GitHub API calls.
 */
function getGitHubClient() {
    return axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/vnd.github.v3+json',
        },
    });
}

/**
 * Generates the log entry with the current ISO timestamp.
 */
function generateLogEntry() {
    return `Daily auto streak update - ${new Date().toISOString()}\n`;
}

/**
 * Fetches the existing file metadata and content from the repository.
 * If the file doesn't exist, returns null.
 */
async function getExistingFile(client) {
    const url = `/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;

    try {
        const response = await client.get(url);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // File does not exist
            return null;
        }
        console.error(`❌ Error fetching existing file: ${error.message}`);
        throw error;
    }
}

/**
 * Commits the new or updated file to the repository.
 */
async function commitFile(client, existingFile, newContentRaw) {
    const url = `/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const commitMessage = `Daily auto streak update - ${dateStr}`;

    let finalContentRaw = newContentRaw;
    let sha = undefined;

    if (existingFile) {
        // GitHub API returns content as base64 with newlines. We must decode to append.
        const existingContentDecoded = Buffer.from(existingFile.content, 'base64').toString('utf8');
        finalContentRaw = existingContentDecoded + newContentRaw;
        sha = existingFile.sha;
    }

    // GitHub requires base64 encoded content
    const encodedContent = Buffer.from(finalContentRaw).toString('base64');

    const payload = {
        message: commitMessage,
        content: encodedContent,
    };

    if (sha) {
        payload.sha = sha;
    }

    try {
        const response = await client.put(url, payload);
        console.log(`✅ Success! File updated successfully.`);
        console.log(`   Commit message: "${commitMessage}"`);
        console.log(`   Commit SHA: ${response.data.commit.sha}`);
    } catch (error) {
        console.error(`❌ Error committing file: ${error.message}`);
        if (error.response && error.response.data) {
            console.error('   GitHub API Response details:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log('🚀 Starting GitHub streak automation...');

    validateConfig();

    const client = getGitHubClient();
    const newEntry = generateLogEntry();

    try {
        console.log(`📂 Checking repository: ${config.owner}/${config.repo}`);
        console.log(`📄 Searching for file: ${config.filePath}`);

        const existingFile = await getExistingFile(client);

        if (existingFile) {
            console.log('📝 File exists. Preparing to append new entry...');
        } else {
            console.log('✨ File does not exist. Preparing to create new file...');
        }

        await commitFile(client, existingFile, newEntry);

        console.log('🎉 Automation completed successfully.');
    } catch (error) {
        console.error('💥 Automation failed due to an error.');
        process.exit(1);
    }
}

// Execute the script
main();
