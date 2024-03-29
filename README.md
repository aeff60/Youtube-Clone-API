# Youtube Clone API

This is a simple Node.js application that provides an API for accessing videos. It utilizes Express.js for handling HTTP requests, MySQL for database operations, and Swagger for API documentation.

## Prerequisites

Before running this application, ensure you have the following installed:

- Node.js
- MySQL Server
- API client (e.g., Postman) for testing the endpoints

## Installation

1. Clone this repository:

   ```
   git clone https://github.com/your/repository.git
   ```

2. Navigate to the project directory:

   ```
   cd youtube-clone-api
   ```

3. Install dependencies:

   ```
   npm install
   ```

4. Set up your environment variables by creating a `.env` file in the root directory and adding the following variables:

   ```
   DB_HOST=your_database_host
   DB_USERNAME=your_database_username
   DB_PASSWORD=your_database_password
   DB_DATABASE=your_database_name
   DB_PORT=your_database_port
   ```

5. Import the database schema and sample data from `database.sql` file into your MySQL server.

6. If SSL is enabled, place your SSL certificate file `DigiCertGlobalRootCA.crt.pem` in the root directory.

## Usage

To start the server, run:

```
npm start
```

The server will start listening on port 8080 by default.

## Endpoints

- `GET /`: Retrieve a list of videos.
- `GET /short`: Retrieve a list of short videos.
- `GET /subscribe`: Retrieve a list of subscribed channels for a user.
- `GET /result`: Search for videos based on a query.
- `GET /watch`: Retrieve details of a specific video.

For detailed information about the request parameters and responses, you can access the Swagger documentation at `/api-docs`.

## Notes

- This application assumes that videos are stored in a database and served with their corresponding metadata.
- Ensure that the database connection details are correctly configured in the `.env` file.
- Modify the SSL configuration in the database connection if SSL is not required.
- Customize the SQL queries to suit your database schema and requirements.

## Contributing

Contributions are welcome! Feel free to open issues or pull requests for any improvements or features you'd like to add.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.