# Rising BSM Flutter App

This is the mobile client for the Rising BSM (Business Service Management) system.

## Project Structure

This project follows the clean architecture approach with the following layers:

- **Presentation**: UI components, screens, and blocs for state management
- **Domain**: Business logic, entities, and use cases
- **Data**: Repository implementations and data sources
- **Core**: Core utilities and services

## Features

### Implemented
- Project structure and architecture setup
- Model classes for API entities
- API client with authentication handling
- Storage service for secure data storage
- Auth repository and user repository
- Authentication screens (login, register, forgot password, reset password)
- Auth bloc for state management
- Navigation setup with go_router

### In Progress
- Dashboard implementation
- Customer management screens
- Request management screens
- Appointment management screens
- Profile management

## Getting Started

See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed setup instructions.

For development guidelines, see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md).

## Next Steps

1. Run Flutter code generation for JSON serialization:
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

2. Run the app:
   ```bash
   flutter run
   ```

3. Implement remaining screens and features:
   - Dashboard with statistics
   - Customer management
   - Request management
   - Appointment management
   - Notification handling
   - Offline support

## Dependencies

See [pubspec.yaml](./pubspec.yaml) for a complete list of dependencies.

Key dependencies:
- **flutter_bloc**: State management
- **dio**: HTTP client
- **get_it**: Dependency injection
- **go_router**: Navigation
- **flutter_secure_storage**: Secure storage for tokens
- **hive**: Local database for offline data
- **flutter_screenutil**: Responsive UI
