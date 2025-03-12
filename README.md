# Helpdesk Application

A comprehensive helpdesk application with role-based access control, built with Express.js, PostgreSQL, and EJS.

## Features

- **Role-Based Access Control**: Three user roles with different permissions:
  - **Helpdesk Operators**: Create tickets, assign tickets to technicians, close resolved tickets
  - **IT Technicians**: Work on assigned tickets, update ticket status, manage equipment
  - **Managers**: Full access to all features, user management, reporting

- **Ticket Management**:
  - Create, view, assign, and update tickets
  - Track ticket status (open, assigned, in progress, on hold, resolved, closed)
  - Add comments to tickets (public and internal)
  - Associate tickets with specific equipment

- **Equipment Management**:
  - Track IT equipment (computers, printers, phones, network devices, servers)
  - Manage equipment details, warranty information, and status
  - Associate equipment with specific offices

- **Office Management**:
  - Manage multiple office locations
  - Associate users and equipment with specific offices

- **User Management**:
  - Create and manage user accounts
  - Assign roles and offices to users

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Frontend**: EJS templates, Bootstrap 5
- **Authentication**: Passport.js with local strategy
- **Security**: bcrypt for password hashing

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd helpdesk-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a PostgreSQL database:
   ```
   createdb helpdesk
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the database connection details in `.env`

5. Run database migrations and seed data:
   ```
   npm run seed
   ```

6. Start the application:
   ```
   npm start
   ```

7. Access the application at `http://localhost:3000`

## Default Users

After seeding the database, you can log in with the following credentials:

- **Manager**:
  - Email: admin@example.com
  - Password: password123

- **IT Technician**:
  - Email: tech@example.com
  - Password: password123

- **Helpdesk Operator**:
  - Email: helpdesk@example.com
  - Password: password123

## Development

For development with automatic server restart:
```
npm run dev
```

## License

ISC 