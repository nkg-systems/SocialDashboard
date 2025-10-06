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
   ```powershell
   git clone <repository-url>
   cd SocialDashboard
   git checkout InitialImplementation
   ```

2. **Backend Setup**
   ```powershell
   cd backend
   copy .env.example .env
   # Edit .env with your configuration
   pip install -r requirements.txt
   
   # Run database migrations (when database is ready)
   alembic upgrade head
   
   # Start the API server
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup**
   ```powershell
   cd frontend
   npm install
   
   # Start development server
   npm run dev
   ```

4. **Using Docker (Recommended)**
   ```powershell
   cd docker
   docker-compose -f docker-compose.dev.yml up --build
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
- [📋 **Project Documentation**](./Docs/warp.md) - SM3D project specifications and guidelines
- [📄 **Design Document**](./Docs/SM3D_Design_and_PRD.pdf) - Original design and PRD

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

1. **Switch to the implementation branch**: `git checkout InitialImplementation`
2. **Set up your environment** using the Docker development stack
3. **Configure OAuth credentials** in the `.env` file for your social media platforms
4. **Run database migrations** to set up the schema: `alembic upgrade head`
5. **Access the application**:
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/v1/docs
   - Frontend (when complete): http://localhost:3000

## 🤝 Contributing

This is a personal project built for learning and portfolio purposes. The codebase follows enterprise-grade practices and patterns.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using modern web technologies and best practices**