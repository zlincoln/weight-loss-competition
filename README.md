# Weight Loss Competition App

A private, secure weight tracking application for group weight loss competitions where participants' progress is measured by percentage of weight lost relative to their starting weight.

## Features

- **Private Weight Tracking**: Users can privately enter their starting weight and daily check-ins without revealing their actual weight to other participants.
- **Competition Management**: Admins can create competitions and invite users to participate.
- **Progress & Results**: Users can see competition overviews, rankings, and their personal progress.
- **Privacy-First Design**: Only weight loss percentages are shared, not actual weights.
- **Cloudflare Integration**: Utilizes Cloudflare Access for authentication and Cloudflare D1 for database storage.

## Tech Stack

- **Framework**: [Astro](https://astro.build/) with React components
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [Cloudflare Access](https://www.cloudflare.com/products/zero-trust/access/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite on the edge)
- **Deployment**: Cloudflare Pages & Workers

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Cloudflare account with Access enabled
- Cloudflare D1 database created

### Environment Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/weight-loss-competition-app.git
   cd weight-loss-competition-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create `.env` file with the following variables:
   ```
   CLOUDFLARE_TEAM_DOMAIN=your-team-domain.cloudflareaccess.com
   CLOUDFLARE_AUD=your-aud-tag-from-cloudflare
   ```

4. Update the `wrangler.toml` file with your Cloudflare account ID and D1 database ID.

### Local Development

```
npm run dev
```

### Database Initialization

1. Run the database initialization script:
   ```
   wrangler d1 execute weight_loss_app_db --local --file=./schema.sql
   ```

### Deployment

1. Set up the following GitHub secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_TEAM_DOMAIN`
   - `CLOUDFLARE_AUD`

2. Push to the main branch to trigger a deployment or manually run the GitHub Action workflow.

## Setting up Cloudflare Access

1. In the Cloudflare Zero Trust dashboard, create a new application.
2. Set up the application with:
   - Application name: "Weight Loss Competition App"
   - Session duration: 24 hours (or your preference)
   - App domain: your-app-domain.pages.dev
   
3. Configure access policies to control who can use the application.

4. Note the AUD tag from the application settings page and add it to your environment variables.

## Project Structure

```
weight-loss-competition-app/
├── src/
│   ├── components/      # React components
│   ├── functions/       # Serverless functions
│   ├── lib/             # Shared utilities and DB operations
│   ├── layouts/         # Astro layout components
│   ├── pages/           # Astro pages & API routes
│   └── styles/          # Global CSS
├── public/              # Static assets
├── astro.config.mjs     # Astro configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── wrangler.toml        # Cloudflare Workers configuration
```

## Database Schema

The application uses the following tables:

1. **users** - Stores user information
2. **competitions** - Stores competition details
3. **competition_participants** - Tracks which users are in which competitions
4. **weight_entries** - Stores user weight entries over time

## Privacy Considerations

- User weights are stored securely and never displayed to other users
- Only weight loss percentage and pounds lost are visible in rankings
- All data is encrypted at rest using Cloudflare's encryption

## Future Enhancements

- Multiple simultaneous competitions
- User registration and profile management
- Competition templates and recurring competitions
- Social features (comments, encouragement)
- Achievement badges

## License

MIT

## Acknowledgements

- Cloudflare for providing the infrastructure
- Astro for the excellent web framework
- Tailwind CSS for styling utilities