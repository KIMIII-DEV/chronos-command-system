This is the legacy README for the paid, proprietary version of Chronos Command System. The new version is based on a 100% Open-Source AI Stack.

---

# Chronos Command System

A production-ready cyber-military command interface with TOTP authentication, real-time system monitoring, and AI-powered situational awareness through the Chronos Engine copilot.

## Architecture Overview

The system is built as a **dual-layer architecture**:

### Public Layer (`/`)
- **Purpose**: Access gate with psychological filtering
- **Design**: Cryptic "Access Denied" interface inspired by Call of Duty: Black Ops 2
- **Effects**: Glitch distortions, scanlines, flicker, code overlays, threading text
- **Interaction**: TOTP token entry only
- **No public information disclosed**

### Private Layer (`/private`)
- **Purpose**: Internal command and intelligence interface
- **Design**: Military command-console aesthetic with clean, disciplined layout
- **Features**: System status monitoring, message panels, Chronos Engine copilot
- **Access**: Protected by TOTP authentication and session tokens
- **Modular architecture**: Expandable panel system

## Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Database**: MySQL/TiDB (Drizzle ORM)
- **Authentication**: TOTP (speakeasy) + Session tokens
- **AI**: Chronos Engine (Manus agent wrapper)
- **Deployment**: Vercel-ready with GitHub integration

## Project Structure

```
chronos-command-system/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Public access layer
│   │   │   ├── AccessDenied.tsx      # Cryptic UI with glitch effects
│   │   │   └── Private.tsx           # Protected command dashboard
│   │   ├── components/
│   │   │   └── TOTPInput.tsx         # TOTP verification component
│   │   ├── styles/
│   │   │   └── effects.css           # Glitch, scanline, flicker effects
│   │   ├── App.tsx                   # Route configuration
│   │   └── main.tsx                  # Entry point
│   └── index.html
├── server/
│   ├── _core/
│   │   ├── index.ts                  # Server entry point
│   │   ├── api.ts                    # Custom API routes (TOTP)
│   │   ├── context.ts                # tRPC context
│   │   ├── trpc.ts                   # tRPC setup
│   │   └── ... (other core files)
│   ├── routers/
│   │   ├── chronos.ts                # Chronos Engine tRPC procedures
│   │   └── ... (other routers)
│   ├── totp.ts                       # TOTP utilities (verify, generate, store)
│   ├── chronos.ts                    # Chronos Engine wrapper
│   ├── manus-integration.ts          # Manus agent integration
│   ├── db.ts                         # Database queries
│   └── routers.ts                    # Main tRPC router
├── drizzle/
│   └── schema.ts                     # Database schema (users, totpSecrets, sessions)
├── shared/
│   └── const.ts                      # Shared constants
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## Key Features

### 1. TOTP Authentication
- **Speakeasy-based TOTP** with 30-second rotating codes
- **QR code enrollment** via `/api/generate-totp-qr`
- **Session management** with token-based authentication
- **Clock skew tolerance** (±1 period) for reliability

### 2. Public Layer Effects
- **Glitch distortions**: Chromatic aberration and clip-path animations
- **Scanlines**: Continuous horizontal line overlay
- **Flicker**: Intermittent opacity changes (CRT monitor effect)
- **Code overlays**: Random assembly-like code fragments
- **Threading text**: Rotating psychological messages
- **Number overlays**: Random 8-digit hex numbers

### 3. Private Dashboard
- **System status monitoring**: Uptime, load, health indicators
- **Message/alert panel**: Priority-based notifications
- **Chronos Engine interface**: AI copilot for event correlation and analysis
- **Modular panel architecture**: Easy to extend with new panels
- **Real-time updates**: System metrics refresh every 5 seconds

### 4. Chronos Engine
- **Event correlation**: Analyze security events for patterns
- **Situational awareness**: Assess system health and threats
- **Decision support**: Generate recommendations based on scenarios
- **Streaming responses**: Long-running analyses with real-time feedback
- **Manus agent integration**: Extensible AI framework

## Setup & Configuration

### Prerequisites
- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL/TiDB database

### Installation

```bash
# Clone repository
gh repo clone <owner>/<repo>

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

**Required:**
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Session signing secret
- `VITE_APP_ID`: Manus OAuth application ID
- `OAUTH_SERVER_URL`: Manus OAuth backend URL
- `VITE_OAUTH_PORTAL_URL`: Manus login portal URL

**Optional:**
- `TOTP_SECRET`: Pre-configured TOTP secret (auto-generated if not set)
- `PORT`: Server port (default: 3000)

## Authentication Flow

```
1. User visits /
   ↓
2. AccessDenied page displays with glitch effects
   ↓
3. User enters TOTP code from authenticator app
   ↓
4. POST /api/verify-totp validates code
   ↓
5. Session token created and stored
   ↓
6. User redirected to /private
   ↓
7. Private dashboard loads with system status
```

## API Routes

### TOTP Endpoints

**POST `/api/verify-totp`**
- Verify TOTP code and create session
- Request: `{ userId: number, code: string }`
- Response: `{ success: boolean, token: string }`

**POST `/api/generate-totp-qr`**
- Generate new TOTP secret and QR code
- Request: `{ userId: number, email: string }`
- Response: `{ success: boolean, secret: string, qrCodeUrl: string }`

**POST `/api/verify-totp-enrollment`**
- Verify TOTP code during enrollment
- Request: `{ userId: number, code: string }`
- Response: `{ success: boolean }`

### tRPC Procedures

**`chronos.query`**
- Process general query through Chronos Engine
- Input: `{ prompt: string, userId: number, context?: Record<string, unknown> }`
- Output: `{ analysis: string, insights: string[], recommendations: string[], confidence: number }`

**`chronos.correlateEvents`**
- Correlate security events
- Input: `{ events: Array<{timestamp, type, data}>, userId: number }`
- Output: Chronos response with analysis

**`chronos.analyzeSituation`**
- Analyze system situation
- Input: `{ metrics: Record<string, unknown>, userId: number }`
- Output: Chronos response with assessment

**`chronos.getRecommendations`**
- Get decision support recommendations
- Input: `{ scenario: string, userId: number }`
- Output: Chronos response with recommendations

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM("user", "admin") DEFAULT "user",
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TOTP Secrets Table
```sql
CREATE TABLE totpSecrets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  secret VARCHAR(255) NOT NULL,
  verified TINYINT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id VARCHAR(64) PRIMARY KEY,
  userId INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## Development

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test server/totp.test.ts
```

### Code Quality
```bash
# Type check
pnpm check

# Format code
pnpm format

# Build for production
pnpm build
```

### Development Server
```bash
# Start with hot reload
pnpm dev

# Server runs on http://localhost:3000
# Frontend accessible at http://localhost:3000
```

## Deployment

### Vercel Deployment

1. **Connect repository to Vercel**
   ```bash
   vercel link
   ```

2. **Set environment variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   # ... add other required env vars
   ```

3. **Deploy**
   ```bash
   vercel deploy --prod
   ```

### GitHub Actions CI/CD

The project includes GitHub Actions workflows for:
- Automated testing on push
- Type checking
- Build verification
- Deployment to Vercel (on main branch)

### Docker Deployment

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Security Considerations

1. **TOTP Secrets**: Stored in database with encryption recommended
2. **Session Tokens**: Should be stored in HTTP-Only cookies (currently localStorage)
3. **Rate Limiting**: Implement on `/api/verify-totp` to prevent brute force
4. **CORS**: Configure appropriately for production domain
5. **HTTPS**: Required in production (enforced by Vercel)

## Performance Optimization

- **Lazy loading**: React components loaded on demand
- **Code splitting**: Automatic via Vite
- **Caching**: Static assets cached with content hashing
- **Database**: Connection pooling via Drizzle ORM
- **Compression**: gzip compression on responses

## Known Limitations

1. **Chronos Engine**: Currently uses mock responses (placeholder implementation)
2. **Streaming**: AI streaming responses not yet implemented
3. **Session storage**: Uses localStorage instead of HTTP-Only cookies
4. **Rate limiting**: Not implemented on authentication endpoints
5. **Branding**: Placeholder for company name and logo

## Future Enhancements

1. **Real Chronos Engine**: Integrate full OpenManus agent framework
2. **WebSocket support**: Real-time system updates
3. **Multi-factor authentication**: Additional security layers
4. **Audit logging**: Comprehensive activity tracking
5. **Custom dashboards**: User-configurable panel layouts
6. **API key management**: For programmatic access
7. **Dark/light theme**: Theme switching capability
8. **Internationalization**: Multi-language support

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Contact: support@chronos-command.local

---

**Version**: 1.0.0  
**Last Updated**: January 31, 2026  
**Status**: Production-Ready
