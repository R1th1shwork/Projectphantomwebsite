name: Build Posts JSON

on:
  push:
    paths:
      - 'content/posts/**'
  workflow_dispatch: # Allows manual trigger from the GitHub Actions tab

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write # REQUIRED: Gives GitHub permission to push commits back to your repo

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install gray-matter

      - name: Run build script
        run: node scripts/build-posts.js # Make sure this matches your script's exact location

      - name: Commit and push posts.json
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add posts.json
          git commit -m "auto: update posts.json [skip ci]" || exit 0
          git push
