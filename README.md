# Nursing Home Management System

A comprehensive web-based system for managing nursing home operations, resident care, staff scheduling, and family communication.

## Features

### Resident Management
- Electronic resident profiles with medical history
- Digital care plan management and tracking
- Medication administration and tracking
- Daily activity and wellness monitoring
- Personal details and preferences management

### Staff Management
- Staff scheduling and shift management
- Time tracking and shift assignment
- Staff qualifications and certification tracking
- Task assignments and completion monitoring

### Activity Management
- Activity planning and scheduling
- Resident participation tracking
- Personalized activity recommendations
- Group composition optimization

### Family Portal
- Secure family access to resident information
- Communication tools with care staff
- Photo and update sharing
- Visit scheduling
- Easy feedback submission

### Administrative Features
- Room and bed management
- Inventory and supply monitoring
- Regulatory compliance tools
- Reporting and analytics

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: MockAPI (for demonstration purposes)
- **UI Components**: Headless UI, Hero Icons
- **Forms**: React Hook Form
- **Date Handling**: date-fns
- **Charts**: Chart.js, react-chartjs-2
- **Data Fetching**: Axios

## Getting Started

### Prerequisites

- Node.js 18.0 or newer
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/nursing-home-management.git
cd nursing-home-management
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Run the development server

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
nursing-home-management/
├── public/              # Static files
├── src/
│   ├── app/             # App router pages
│   ├── components/      # Reusable components
│   │   ├── layout/      # Layout components
│   │   ├── residents/   # Resident-related components
│   │   ├── staff/       # Staff-related components
│   │   ├── activities/  # Activity-related components
│   │   └── ui/          # UI components
│   ├── lib/             # Utility functions and API services
│   └── styles/          # Global styles
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json         # Project dependencies
```

## API Integration

This project uses MockAPI for demonstration purposes. In a production environment, you would replace the API endpoints with your actual backend service.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by modern healthcare management systems
- Icons provided by Heroicons
