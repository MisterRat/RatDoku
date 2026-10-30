<div align="center">
  
# RatDoku

A sleek, high-performance Sudoku game and Progressive Web App (PWA) by **MrRat.com** with daily challenges, multiple difficulty levels, logical smart hints, offline support, and statistics tracking.

### [Play it in your browser](https://github.mrrat.org/RatDoku/)

by [MrRat Gaming](https://github.mrrat.org/) &nbsp;·&nbsp; [Discord](https://discord.gg/FybAhsxQHZ)

<img src="docs/screenshot.png" width="320" alt="RatDoku on a phone: a Medium puzzle in progress">

</div>

## Features

- **Progressive Web App (PWA)**: Installable on iOS, Android, macOS, Windows, and Linux with full offline gameplay support.
- **Game Modes**: Classic mode (Easy, Medium, Hard) and Daily Challenges with calendar history and streak tracking.
- **Smart Hint System**: Step-by-step logical hints (Naked Singles, Hidden Singles, Block Intersections, Naked Pairs, and more) with visual explanations.
- **Customizable Themes**: Elegant Dark (obsidian), Minimal Light, Warm Paper, Dark Slate, and Nordic Forest.
- **Rich Gameplay Controls**: Undo, candidate pencil notes, auto-error checking, matching number highlights, peer highlights, sound effects, and timer controls.
- **100% Client-Side & Offline-First**: No external API or cloud dependency required. All game state and daily puzzles are generated and cached locally in the browser.

---

## Playing on GitHub Pages

Every push to `main` also builds RatDoku and publishes it to GitHub Pages at **https://github.mrrat.org/RatDoku/** (workflow: `.github/workflows/pages.yml`). The build uses relative paths, so the same output works at a site root (Docker) or under `/RatDoku/` (Pages). One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

---

## Deploying with Portainer (from GitHub)

GitHub builds RatDoku into a ready-made Docker image every time `main` changes and publishes it at `ghcr.io/misterrat/ratdoku`. Portainer just downloads that image and starts it, so nothing is built on your server and no files need to be copied or edited.

### Create the stack
1. Open Portainer and select your environment.
2. Click **Stacks** in the left sidebar, then **+ Add stack**.
3. **Name**: `ratdoku` (lowercase).
4. **Build method**: choose **Repository**.
5. **Repository URL**: `https://github.com/MisterRat/RatDoku`
6. **Repository reference**: `refs/heads/main`
7. **Compose path**: `docker-compose.yml`
8. Optional: under **Environment variables**, add `PORT` to use a port other than the default `3030`.
9. Click **Deploy the stack**, then open `http://<your-server-ip>:3030`.

### Updating to a new version
Open the stack in Portainer, click **Pull and redeploy**, and make sure **Re-pull image** is switched on. Portainer downloads the newest image that GitHub built from `main`.

### Where game data is kept
RatDoku has no server-side data. Saved games, settings, stats and streaks are stored in each player's browser for the address they use, so redeploying or updating the container never touches them. Keep the same address and port to keep players' progress.

### Alternative: Docker Compose from the command line
```bash
git clone https://github.com/MisterRat/RatDoku.git
cd RatDoku
docker compose up -d                                        # use the published image
docker compose -f docker-compose.build.yml up -d --build    # or build it yourself
```

Then open `http://localhost:3030` (or the `PORT` you set).

---

## Local Development

```bash
# Install the exact locked dependency versions
npm ci

# Start Vite dev server on port 3000
npm run dev

# Type-check and run the puzzle generator tests
npm run lint
npm test

# Build for production
npm run build
```

### Versioning

The version shown in the app header and settings comes from `version` in `package.json`. To release, bump it there (for example `npm version minor`), push the commit, and push a matching `vX.Y.Z` tag so the workflow also publishes a versioned image.

### Continuous integration

Every push and pull request runs the type-check and tests. The container image is only built and published to `ghcr.io/misterrat/ratdoku` after they pass.

### Daily puzzles

Daily challenges are generated from a seed made from the date and difficulty, so every player gets the same grid. A test pins the output for a fixed date; if a generator change makes it fail, that change would alter everyone's past and future daily puzzles.

---

## License

RatDoku is released under the [MIT License](LICENSE).
