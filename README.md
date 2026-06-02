# Srimali Batik (Local Application)

This is a fully local, modern web application for Srimali Batik. It runs completely on localhost with no dependencies on any cloud services (like Neon DB or Netlify). It uses a local SQLite database for persistent storage.

## Features

- **Public Storefront**: Browse batik patterns and products.
- **Product Detail View**: View specific products under each design and select colors.
- **WhatsApp Integration**: Customers can easily place orders via WhatsApp directly from a product.
- **Admin Panel**: Manage Patterns, Products, and Colors using a clean interface.
- **Real-Time Sync**: Changes made in the Admin Panel immediately reflect in the public storefront without refreshing the page.
- **Local SQLite DB**: Zero-configuration, file-based database.

## Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Responsive, Dark Mode)
- **Backend**: Node.js, Express.js
- **Database**: SQLite (via `better-sqlite3`)
- **Real-Time**: WebSockets

## Folder Structure

```
srimali-batik/
├── data/               # Auto-created directory holding the SQLite database (srimali.db)
├── public/             # Static files (HTML, CSS, JS, Images)
│   ├── css/
│   ├── js/
│   ├── admin.html      # Admin dashboard
│   └── index.html      # Public storefront
├── src/                # Backend source code
│   ├── routes/         # Express API routes (patterns, products, colors)
│   ├── broadcast.js    # WebSocket syncing logic
│   └── db.js           # SQLite initialization and connection
├── server.js           # Main Express server entry point
└── package.json        # Project dependencies and scripts
```

## Installation & Setup

1. **Clone or Download the Project** to your computer.
2. **Open a Terminal** in the project's root folder.
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Start the Application**:
   ```bash
   npm run dev
   ```
   *(Alternatively, use `npm start` for production mode).*
5. **Open in Browser**:
   - Public Storefront: [http://localhost:3000](http://localhost:3000)
   - Admin Panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Database Setup

The application uses a local SQLite database. You do **not** need to set up any external database or run any migration scripts. 
When you start the server for the first time, it will automatically create the `data/srimali.db` file and set up all the necessary tables. 

Data is persisted on your local disk within the `data/` folder.

## Troubleshooting

- **"Address already in use" Error**: If port 3000 is occupied, you can change the port by creating a `.env` file in the root folder with `PORT=4000` (or any other port), or run `PORT=4000 npm start`.
- **Database Errors**: If the database gets corrupted or you want to start fresh, simply delete the `data/srimali.db` file and restart the server.
- **WebSocket Reconnection**: If the server restarts, the frontend will automatically attempt to reconnect to the WebSocket.

## Local Development Notes

- **No Authentication**: The admin panel is accessed at `/admin` without a password. Since this application runs solely on localhost, it is only accessible from your machine.
- **Images**: You can paste any image URL (e.g., from an image hosting service) in the Admin Panel to set product and pattern images.
