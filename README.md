# Entra Claims Service

This project is a Node.js and Express web service that provides custom claims for Entra ID custom extensions. It serves as a backend service to handle requests related to claims and ensures secure access through authentication middleware.

## Project Structure

```
entra-claims-service
├── src
│   ├── app.js                  # Entry point of the application
│   ├── controllers
│   │   └── claimsController.js  # Handles claims-related requests
│   ├── routes
│   │   └── claims.js           # Defines claims-related routes
│   ├── middleware
│   │   └── auth.js             # Authentication middleware
│   └── utils
│       └── claimsHelper.js      # Utility functions for claims processing
├── package.json                 # NPM configuration file
├── .env.example                 # Example environment variables
└── README.md                    # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/entra-claims-service.git
   ```

2. Navigate to the project directory:
   ```
   cd entra-claims-service
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file based on the `.env.example` file and fill in the required environment variables.

## Usage

To start the server, run the following command:
```
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

- **GET /claims**: Retrieves custom claims.
  - Authentication is required.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.