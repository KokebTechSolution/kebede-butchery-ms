# Security Policy

## Supported Versions

This project is actively maintained and security updates are applied as needed.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it to us at [your-email@example.com].

## Development Dependencies

Some security alerts may appear for development dependencies (like `react-scripts`, `webpack-dev-server`, etc.). These are:

- **Not used in production** - They only exist during development
- **Common in React projects** - Most React apps have these same alerts
- **Safe to ignore** - They don't affect your deployed application

## Production Security

Our production application uses:
- Secure session management
- CSRF protection
- Input validation
- SQL injection prevention
- XSS protection

## Security Measures

1. **Authentication**: Session-based authentication with CSRF protection
2. **Authorization**: Role-based access control
3. **Data Validation**: All inputs are validated and sanitized
4. **HTTPS**: All production traffic uses HTTPS
5. **CORS**: Properly configured for cross-origin requests

## Dependabot Alerts

We monitor security alerts through GitHub Dependabot. Development dependency alerts are evaluated on a case-by-case basis and may be ignored if they don't affect production security. 