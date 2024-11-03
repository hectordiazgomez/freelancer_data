# Freelancer Data Scraper

This project scrapes freelancer data and their project details from Freelancer.com, specifically focusing on US-based freelancers.

## Repository

```bash
git clone https://github.com/hectordiazgomez/freelancer_data.git
```

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Usage

The scraping process consists of three steps:

### 1. Scrape Usernames

Run the following command to scrape usernames of US-based freelancers:

```bash
node get_usernames.js
```

This will create `usa_usernames.json` containing the raw username data.

### 2. Clean Usernames

Process and clean the scraped usernames:

```bash
node modify_usernames.js
```

This will create `cleaned_usernames.json` containing the processed username data.

### 3. Configure Freelancer.com Credentials

Before running the final script:
1. Create an account at freelancer.com
2. Open `index.js`
3. Replace the following placeholders with your credentials:
```javascript
const USERNAME = '';
const PASSWORD = '';
```

### 4. Scrape Project Details

After configuring your credentials, run:

```bash
node index.js
```

This will generate `projects_details.json` containing the following information for each project:
- Project Name
- Price
- Review
- Date

## Notes

- The scraper is specifically designed for US-based freelancers
- Data is saved in JSON format for easy processing
- Protect your freelancer.com credentials and avoid sharing them