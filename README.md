# Nursing Home Management System

A comprehensive Next.js application for managing nursing home operations, built with modern web technologies and best practices.

## 🚀 Features

- **Modern Tech Stack**: Next.js 15, React 19, TypeScript
- **Responsive Design**: Tailwind CSS with custom animations
- **State Management**: Redux Toolkit
- **UI Components**: Material-UI, Headless UI, Radix UI
- **Database**: Prisma ORM
- **Authentication**: NextAuth.js
- **Payment Integration**: PayOS
- **AI Recommendations**: OpenAI integration
- **Real-time Features**: WebSocket support
- **Performance Optimized**: Image optimization, code splitting

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.4.5** - React framework with App Router
- **React 19.1.1** - Latest React with concurrent features
- **TypeScript 5.3.3** - Type-safe JavaScript
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Material-UI 7.2.0** - React component library
- **Headless UI 2.2.6** - Unstyled accessible components
- **Radix UI** - Low-level UI primitives

### State Management & Data
- **Redux Toolkit 2.8.2** - State management
- **React Hook Form 7.50.1** - Form handling
- **Zod 4.0.14** - Schema validation
- **Prisma 6.13.0** - Database ORM

### Development Tools
- **ESLint** - Code linting with strict rules
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Tailwind CSS Plugins** - Typography, Forms, Aspect Ratio

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nursing-home-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts
- `npm run analyze` - Analyze bundle size

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── activities/        # Activity management
│   ├── admin/            # Admin dashboard
│   ├── staff/            # Staff management
│   ├── residents/        # Resident management
│   ├── family/           # Family portal
│   ├── finance/          # Financial management
│   └── api/              # API routes
├── components/           # Reusable components
│   ├── layout/          # Layout components
│   ├── staff/           # Staff-specific components
│   └── shared/          # Shared components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   ├── api/            # API utilities
│   ├── contexts/       # React contexts
│   ├── utils/          # Utility functions
│   └── validations/    # Validation schemas
└── middleware.ts       # Next.js middleware
```

## 🔧 Configuration

### Next.js Configuration
- **App Router**: Modern routing with server components
- **Image Optimization**: WebP/AVIF support
- **Security Headers**: XSS protection, content type options
- **Performance**: Compression, caching, bundle optimization

### TypeScript Configuration
- **Strict Mode**: Enhanced type safety
- **Path Mapping**: Clean imports with `@/*`
- **Modern Target**: ES2022 for latest features

### Tailwind CSS Configuration
- **Custom Colors**: Primary, secondary, accent, success, warning, error
- **Custom Animations**: Fade, slide, scale, bounce effects
- **Custom Shadows**: Soft, card, glow effects
- **Typography**: Custom font families and spacing

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: Static generation and ISR
- **Minification**: SWC minifier for faster builds

## 🔒 Security Features

- **Security Headers**: XSS protection, content type options
- **Rate Limiting**: Basic rate limiting in middleware
- **Input Validation**: Zod schema validation
- **Authentication**: Secure session management

## 📱 Responsive Design

- **Mobile First**: Responsive design approach
- **Touch Friendly**: Optimized for touch devices
- **Accessibility**: WCAG compliant components
- **Cross Browser**: Modern browser support

## 🧪 Testing

- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint with accessibility rules
- **Formatting**: Prettier for consistent code style
- **Performance**: Bundle size monitoring

## 📈 Monitoring & Analytics

- **Error Tracking**: Built-in error boundaries
- **Performance Monitoring**: Core Web Vitals
- **User Analytics**: Privacy-focused analytics
- **Health Checks**: API endpoint monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ using Next.js and modern web technologies**
