# Requirements Document

## Introduction

This document specifies requirements for improving the Webster/Marketo platform integration within the Venture Factory platform. The current integration uses MCP (Model Context Protocol) tools that can execute via REST API or browser extension, but lacks proper credential management UI, connection validation, rate limiting, and error handling. These improvements will provide a production-ready integration that respects API limits, handles failures gracefully, and provides users with a clear interface for managing their Marketo credentials.

## Glossary

- **Webster_Agent**: The AI-powered Marketo operations assistant that integrates with Marketo via MCP tools
- **MCP_Tool**: Model Context Protocol tool that executes either via REST API or browser extension
- **Credential_Manager**: The system component responsible for storing and retrieving Marketo API credentials
- **Connection_Validator**: The system component that tests Marketo API connectivity and credential validity
- **Rate_Limiter**: The system component that enforces Marketo API rate limits (100 calls per 20 seconds)
- **Retry_Handler**: The system component that implements exponential backoff for failed API calls
- **Settings_UI**: The user interface for managing Marketo credentials and connection status
- **REST_API_Mode**: Execution mode where MCP tools call Marketo REST API directly using stored credentials
- **Browser_Extension_Mode**: Execution mode where MCP tools dispatch to the Webster Chrome extension
- **Circuit_Breaker**: A pattern that prevents repeated calls to a failing service after a threshold is reached

## Requirements

### Requirement 1: Credential Management UI

**User Story:** As a Marketo user, I want to manage my Marketo API credentials through a dedicated settings page, so that I don't have to provide credentials via chat prompts every time.

#### Acceptance Criteria

1. THE Settings_UI SHALL display a dedicated page for Marketo credential management at `/settings/integrations/marketo`
2. WHEN a user navigates to the Marketo settings page, THE Settings_UI SHALL display input fields for Instance URL, Client ID, and Client Secret
3. WHEN a user enters credentials, THE Credential_Manager SHALL validate the format before allowing save (Instance URL must be a valid HTTPS URL, Client ID and Client Secret must be non-empty strings)
4. WHEN a user saves valid credentials, THE Credential_Manager SHALL encrypt the credentials at rest using AES-256 encryption
5. THE Credential_Manager SHALL scope credentials per user (each user has their own credential set)
6. WHEN credentials are successfully saved, THE Settings_UI SHALL display a success message and update the connection status indicator
7. WHEN a user has existing credentials, THE Settings_UI SHALL display masked values (e.g., "••••••••") for Client Secret
8. THE Settings_UI SHALL provide a "Clear Credentials" button that removes stored credentials after user confirmation
9. WHEN credentials are cleared, THE Webster_Agent SHALL fall back to browser extension mode for tool execution

### Requirement 2: Connection Testing and Validation

**User Story:** As a Marketo user, I want to test my API connection and see real-time validation feedback, so that I know my credentials are working before I start using Webster.

#### Acceptance Criteria

1. THE Settings_UI SHALL display a "Test Connection" button on the Marketo settings page
2. WHEN a user clicks "Test Connection", THE Connection_Validator SHALL attempt to authenticate with the Marketo REST API using the stored credentials
3. WHEN the connection test succeeds, THE Connection_Validator SHALL retrieve basic instance information (pod, Munchkin ID) and THE Settings_UI SHALL display "Connected" status with a green indicator
4. WHEN the connection test fails, THE Connection_Validator SHALL return a structured error response and THE Settings_UI SHALL display the error category (authentication failure, network error, invalid endpoint)
5. THE Settings_UI SHALL display the last successful connection timestamp when credentials are valid
6. WHEN credentials are saved, THE Connection_Validator SHALL automatically run a connection test before confirming the save
7. IF the automatic connection test fails, THE Settings_UI SHALL display the error and ask the user to confirm whether to save the credentials anyway
8. THE Settings_UI SHALL display connection status on the main integrations page (connected, disconnected, error) with appropriate visual indicators

### Requirement 3: Rate Limiting and Retry Logic

**User Story:** As a Marketo user, I want the system to respect Marketo's API rate limits and automatically retry failed requests, so that my operations don't fail due to temporary issues or rate limit violations.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL enforce Marketo's rate limit of 100 API calls per 20-second window
2. WHEN the rate limit is reached, THE Rate_Limiter SHALL queue additional requests until the window resets
3. THE Rate_Limiter SHALL track API call timestamps per user to calculate the current rate
4. WHEN an API call fails with a 5xx error or network timeout, THE Retry_Handler SHALL retry the request using exponential backoff (1s, 2s, 4s, 8s)
5. THE Retry_Handler SHALL support a configurable maximum retry count (default: 3 retries)
6. WHEN an API call fails with a 429 (rate limit) response, THE Retry_Handler SHALL wait for the duration specified in the Retry-After header before retrying
7. WHEN an API call fails with a 4xx error (except 429), THE Retry_Handler SHALL NOT retry and SHALL return the error immediately
8. THE Circuit_Breaker SHALL open after 5 consecutive failures to the same endpoint within a 60-second window
9. WHEN the Circuit_Breaker is open, THE Rate_Limiter SHALL reject new requests to that endpoint with a "service unavailable" error for 30 seconds
10. WHEN the Circuit_Breaker timeout expires, THE Rate_Limiter SHALL allow one test request (half-open state) and close the circuit if it succeeds

### Requirement 4: Enhanced Error Handling

**User Story:** As a Marketo user, I want clear and actionable error messages when something goes wrong, so that I can understand what happened and how to fix it.

#### Acceptance Criteria

1. WHEN a browser-executed MCP_Tool returns an error, THE Webster_Agent SHALL receive a structured error response with error category, message, and suggested action
2. THE Webster_Agent SHALL categorize errors into: authentication errors, rate limit errors, network errors, validation errors, and unknown errors
3. WHEN an authentication error occurs, THE Webster_Agent SHALL display a message directing the user to check their credentials in settings
4. WHEN a rate limit error occurs, THE Webster_Agent SHALL display a message indicating the system is waiting for the rate limit window to reset
5. WHEN a network error occurs, THE Webster_Agent SHALL display a message indicating a temporary connectivity issue and that the system will retry automatically
6. WHEN a validation error occurs, THE Webster_Agent SHALL display the specific validation failure (e.g., "Invalid program ID: 12345")
7. THE Credential_Manager SHALL log all API errors to the application logging system with error category, timestamp, user ID, and endpoint
8. THE Settings_UI SHALL display a link to error logs when connection tests fail
9. WHEN an MCP_Tool fails in REST_API_Mode, THE Webster_Agent SHALL gracefully degrade to Browser_Extension_Mode if credentials are invalid
10. THE Webster_Agent SHALL never expose raw API error responses containing sensitive information (tokens, internal IDs) to the user

### Requirement 5: Backward Compatibility

**User Story:** As a platform administrator, I want the new credential management system to work seamlessly with existing Webster agents, so that current users experience no disruption.

#### Acceptance Criteria

1. WHEN a user has no stored credentials, THE Webster_Agent SHALL continue to use Browser_Extension_Mode for all MCP_Tool calls
2. WHEN a user stores credentials, THE Webster_Agent SHALL automatically switch to REST_API_Mode for subsequent tool calls
3. THE MCP_Tool response format SHALL remain unchanged (browserExecution: true or source: "rest_api")
4. THE Webster_Agent SHALL continue to support the existing check_marketo_credentials and store_marketo_credentials tools for backward compatibility
5. WHEN credentials are stored via the Settings_UI, THE check_marketo_credentials tool SHALL return { configured: true, source: "settings_ui" }
6. WHEN credentials are stored via the store_marketo_credentials tool, THE Credential_Manager SHALL save them to the same encrypted storage used by the Settings_UI
7. THE Webster_Agent SHALL maintain the existing tool call signature and parameter structure for all Marketo tools

### Requirement 6: Database Schema and Storage

**User Story:** As a platform administrator, I want Marketo credentials stored securely in the database with proper encryption and access controls, so that user data is protected.

#### Acceptance Criteria

1. THE Credential_Manager SHALL create a new database table `marketo_credentials` with columns: id, user_id, instance_url, client_id_encrypted, client_secret_encrypted, last_validated_at, created_at, updated_at
2. THE Credential_Manager SHALL use Prisma ORM for all database operations
3. THE Credential_Manager SHALL encrypt client_id and client_secret using AES-256-GCM before storing in the database
4. THE Credential_Manager SHALL store the encryption key in an environment variable (MARKETO_CREDENTIALS_ENCRYPTION_KEY)
5. THE Credential_Manager SHALL enforce a unique constraint on (user_id) to ensure one credential set per user
6. WHEN credentials are deleted, THE Credential_Manager SHALL permanently remove the database record (no soft delete)
7. THE Credential_Manager SHALL update the last_validated_at timestamp whenever a successful connection test completes

### Requirement 7: API Route Implementation

**User Story:** As a frontend developer, I want well-defined API routes for credential management operations, so that I can build the Settings UI efficiently.

#### Acceptance Criteria

1. THE Credential_Manager SHALL expose a POST endpoint at `/api/integrations/marketo/credentials` for saving credentials
2. THE Credential_Manager SHALL expose a GET endpoint at `/api/integrations/marketo/credentials` for retrieving credential status (returns masked values, not plaintext)
3. THE Credential_Manager SHALL expose a DELETE endpoint at `/api/integrations/marketo/credentials` for removing credentials
4. THE Connection_Validator SHALL expose a POST endpoint at `/api/integrations/marketo/test-connection` for testing connectivity
5. WHEN an unauthenticated user calls any credential endpoint, THE Credential_Manager SHALL return a 401 Unauthorized response
6. WHEN a user calls GET /api/integrations/marketo/credentials, THE Credential_Manager SHALL return { configured: true, instanceUrl: string, lastValidatedAt: string | null } if credentials exist
7. WHEN a user calls GET /api/integrations/marketo/credentials and no credentials exist, THE Credential_Manager SHALL return { configured: false }
8. WHEN a user calls POST /api/integrations/marketo/test-connection, THE Connection_Validator SHALL return { success: boolean, error?: { category: string, message: string }, instanceInfo?: { pod: string, munchkinId: string } }

### Requirement 8: MCP Tool Integration

**User Story:** As a Webster agent, I want to automatically use stored credentials when calling Marketo tools, so that I can provide seamless data access without prompting users.

#### Acceptance Criteria

1. WHEN the Webster_Agent calls an MCP_Tool, THE MCP_Tool SHALL check for stored credentials via the Credential_Manager
2. IF credentials are found and valid, THE MCP_Tool SHALL execute in REST_API_Mode and return { source: "rest_api", data: [...] }
3. IF credentials are not found or invalid, THE MCP_Tool SHALL execute in Browser_Extension_Mode and return { browserExecution: true, status: "dispatched" }
4. THE MCP_Tool SHALL pass user_id from the tool call context to the Credential_Manager for credential lookup
5. WHEN an MCP_Tool call fails due to invalid credentials, THE MCP_Tool SHALL mark the credentials as invalid in the database and notify the user
6. THE MCP_Tool SHALL apply rate limiting before making REST API calls
7. THE MCP_Tool SHALL apply retry logic with exponential backoff for failed REST API calls
8. WHEN the Circuit_Breaker is open, THE MCP_Tool SHALL return an error immediately without attempting the API call

### Requirement 9: Frontend Components

**User Story:** As a Marketo user, I want an intuitive and responsive settings interface, so that I can easily manage my credentials and monitor connection status.

#### Acceptance Criteria

1. THE Settings_UI SHALL create a new page component at `src/app/settings/integrations/marketo/page.tsx`
2. THE Settings_UI SHALL use the existing Venture Factory design system (HeroUI components, Tailwind CSS v4, VF tokens)
3. THE Settings_UI SHALL display a form with three input fields: Instance URL (text), Client ID (text), Client Secret (password)
4. THE Settings_UI SHALL display a "Save Credentials" button that is disabled until all fields are filled
5. THE Settings_UI SHALL display a "Test Connection" button that is enabled only when credentials are saved
6. THE Settings_UI SHALL display a connection status indicator (green dot for connected, red dot for disconnected, yellow dot for error)
7. THE Settings_UI SHALL display the last validated timestamp in relative time format (e.g., "Last tested 5 minutes ago")
8. THE Settings_UI SHALL display a loading spinner during save and test operations
9. THE Settings_UI SHALL display error messages in a dismissible alert component
10. THE Settings_UI SHALL provide a link to Marketo documentation for finding API credentials

### Requirement 10: Environment Configuration

**User Story:** As a platform administrator, I want to configure rate limits and retry behavior via environment variables, so that I can tune the system for different deployment environments.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL read the rate limit from environment variable MARKETO_RATE_LIMIT_CALLS (default: 100)
2. THE Rate_Limiter SHALL read the rate limit window from environment variable MARKETO_RATE_LIMIT_WINDOW_SECONDS (default: 20)
3. THE Retry_Handler SHALL read the maximum retry count from environment variable MARKETO_MAX_RETRIES (default: 3)
4. THE Retry_Handler SHALL read the initial backoff delay from environment variable MARKETO_RETRY_INITIAL_DELAY_MS (default: 1000)
5. THE Circuit_Breaker SHALL read the failure threshold from environment variable MARKETO_CIRCUIT_BREAKER_THRESHOLD (default: 5)
6. THE Circuit_Breaker SHALL read the timeout duration from environment variable MARKETO_CIRCUIT_BREAKER_TIMEOUT_SECONDS (default: 30)
7. THE Credential_Manager SHALL read the encryption key from environment variable MARKETO_CREDENTIALS_ENCRYPTION_KEY (required, no default)
8. WHEN MARKETO_CREDENTIALS_ENCRYPTION_KEY is not set, THE Credential_Manager SHALL throw an error at startup and refuse to start the application

