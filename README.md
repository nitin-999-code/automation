# GitHub Streak Automation

A production-ready Node.js project that automatically maintains your GitHub contribution streak by appending a daily timestamp to a file (`data/log.txt`) using the **GitHub REST API**. It does not require any Git CLI commands installed on the machine running it.

## 🚀 Features
- **No Git required**: Pure API implementation using Axios.
- **Auto-creates**: Initializes the file if it doesn't already exist.
- **Non-destructive updates**: Preserves existing file content and properly decodes/encodes Base64 for the GitHub API.
- **Production clean**: Proper async/await, centralized configuration, and meaningful console logging.

---

## 🛠️ Setup Instructions

1. **Clone or Download the Repository**
   ```bash
   git clone <your-repo-url>
   cd streak-automation
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Copy the `.env.example` file to create your own `.env` file:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and configure your credentials:
     - `GITHUB_TOKEN`: A GitHub Personal Access Token (classic) with `repo` scope.
     - `GITHUB_OWNER`: Your GitHub username (or organization name).
     - `GITHUB_REPO`: The repository name where the logs will be written.

---

## 🏃 How to Run Manually

Once setup is complete, you can manually trigger a streak update by running:
```bash
npm start
```
You will see console output detailing the steps: validating config, searching for the file, and committing the change to GitHub.

---

## ⏰ How to Deploy in a Scheduler

You can deploy this script to automatically run every day using a variety of scheduling tools.

### Option 1: GitHub Actions (Recommended)
This is the easiest and free option since you're already interacting with GitHub. 

1. Go to your repository settings and add your environment variables as **Repository Secrets** (Settings > Secrets and variables > Actions): `GITHUB_TOKEN_SECRET`, `GITHUB_OWNER`, and `GITHUB_REPO`.
2. Create a workflow file at `.github/workflows/streak.yml`:

```yaml
name: Streak Automation

on:
  schedule:
    # Runs at 00:00 UTC every day
    - cron: '0 0 * * *'
  workflow_dispatch: # Allows manual trigger from GitHub UI

jobs:
  run-automation:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm install

      - name: Run Automation
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN_SECRET }}
          GITHUB_OWNER: ${{ secrets.GITHUB_OWNER }}
          GITHUB_REPO: ${{ secrets.GITHUB_REPO }}
        run: npm start
```

### Option 2: Cron (Linux / macOS / VPS)
If you have a server running 24/7 (like a VPS or Raspberry Pi), you can use the built-in `cron` daemon.

1. Open your crontab editor:
   ```bash
   crontab -e
   ```
2. Add the following line to run the script every day at midnight (adjust the paths to match your actual server structure):
   ```bash
   0 0 * * * cd /absolute/path/to/streak-automation && /usr/bin/node src/index.js >> /absolute/path/to/streak-automation/automation.log 2>&1
   ```
   *(Ensure the `node` path is correct by running `which node`, and make sure your `.env` is loaded inside the `/absolute/path/to/streak-automation` directory)*.

### Option 3: Windows Task Scheduler
1. Open Task Scheduler and click "Create Basic Task...".
2. Name it "GitHub Streak Automation".
3. Set Trigger to "Daily".
4. Set Action to "Start a program".
5. Program/script: `node` (or the full path to `node.exe`).
6. Add arguments: `src/index.js`.
7. Start in: `C:\full\path\to\streak-automation`.
