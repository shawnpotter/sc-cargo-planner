# SC Cargo Planner

A Universal Cargo Management System for Star Citizen, built with Next.js, TypeScript, Prisma, and NextAuth.

## Overview

This project is the source code for the deployed SC Cargo Planner website.  
It is provided for transparency, learning, and community contributions.

**Note:**  
This repository is not intended for users to deploy their own versions.  
If you want to use the SC Cargo Planner, please visit the official website.

## Features

- Visual cargo hold planning and ship selection
- Cargo manifest and contract management
- Crew payment distribution
- Authentication (sign in, sign up, guest access)
- User settings and account management
- Modern, terminal-inspired UI

## Map API Integration

The planner now supports loading location data from an external SC Map API through internal proxy routes.

Set these environment variables in your local environment:

- `SCMAP_BASE_URL` - Base URL to the external map API (`http://localhost:3000/api` in development)
- `SCMAP_API_KEY` - API key sent as `X-API-Key` for upstream requests
- `SCMAP_DEFAULT_SYSTEM` - Optional default system id (defaults to `stanton`)
- `SCMAP_EXCLUDED_KINDS` - Optional comma-separated kinds excluded from selectable locations

When the upstream map API is unavailable, the app serves the most recent successful map snapshot from in-memory cache on the server.

## Contributing

Contributions are welcome for bug fixes, improvements, and new features.  
Please open an issue or pull request with your suggestions.

## License

This project is provided for educational and community purposes.  
Star Citizen and all related trademarks are property of Cloud Imperium Games.  
This project is a fan tool and not affiliated with CIG.

---
