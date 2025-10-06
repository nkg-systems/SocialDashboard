# SM3D - Social Media Monitoring & Management Dashboard

> A centralized AI-driven platform for managing, analyzing, and automating multi-platform social media accounts.

![SM3D Banner](https://img.shields.io/badge/SM3D-Social%20Media%20Dashboard-E50914?style=for-the-badge&logo=react)

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SocialDashboard
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Using Docker (Recommended)**
   ```bash
   cd docker
   docker-compose -f docker-compose.dev.yml up
   ```

## 🌟 Features

- **Multi-Platform Integration**: Twitter, Facebook, Instagram, LinkedIn, TikTok, YouTube
- **Secure OAuth2 Authentication**: PKCE-enabled flows for all platforms
- **Real-time Analytics**: Comprehensive metrics and growth tracking
- **Post Management**: Cross-platform publishing and scheduling
- **AI-Powered Insights**: Smart recommendations and trend analysis
- **Dark Theme UI**: Modern, minimalist design following SM3D specifications

## 🏗️ Architecture

- **Backend**: FastAPI + PostgreSQL + Redis + Celery
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Authentication**: JWT with HTTP-only cookies
- **Security**: Token encryption, input validation, rate limiting

## 📚 Documentation

- [📖 **Project Overview**](./Docs/README.md) - Detailed project information
- [🏛️ **System Architecture**](./Docs/ARCHITECTURE.md) - Technical architecture and design
- [✅ **Implementation Status**](./Docs/IMPLEMENTATION_STATUS.md) - Current progress and completion status
- [📋 **API Documentation**](./Docs/api/) - API endpoints and usage

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern, fast API framework
- **PostgreSQL**: Primary database for structured data
- **Redis**: Caching and session storage
- **SQLAlchemy**: Database ORM with migrations
- **Celery**: Background task processing

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization
- **React Query**: API state management

## 🔒 Security

- **JWT Authentication** with automatic refresh
- **OAuth2 with PKCE** for social media integrations
- **Token Encryption** using Fernet
- **Input Validation** with Pydantic
- **Rate Limiting** and abuse protection
- **HTTPS Enforcement** and secure headers

## 📊 Current Status

**Backend**: ✅ **100% Complete**
- Authentication system
- Social media integrations  
- Post management API
- Analytics engine

**Frontend**: ✅ **80% Complete**
- Configuration and setup
- Type system and API client
- Theme implementation
- *UI components in progress*

## 🚦 Getting Started

1. **Set up your environment** using the Docker development stack
2. **Configure OAuth credentials** for your social media platforms
3. **Run database migrations** to set up the schema
4. **Start the development servers** and begin building

## 🤝 Contributing

This is a personal project built for learning and portfolio purposes. The codebase follows enterprise-grade practices and patterns.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using modern web technologies and best practices**