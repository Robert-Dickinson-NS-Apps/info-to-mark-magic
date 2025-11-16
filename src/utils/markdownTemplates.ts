export interface MarkdownTemplate {
  id: string;
  name: string;
  description: string;
  category: 'documentation' | 'blog' | 'technical' | 'api';
  template: string;
}

export const markdownTemplates: MarkdownTemplate[] = [
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Standard documentation format with sections and examples',
    category: 'documentation',
    template: `# Documentation Title

## Overview

Brief overview of what this documentation covers.

## Getting Started

### Prerequisites

- Requirement 1
- Requirement 2
- Requirement 3

### Installation

\`\`\`bash
# Installation commands
npm install package-name
\`\`\`

## Usage

### Basic Usage

\`\`\`javascript
// Example code
const example = new Example();
\`\`\`

### Advanced Usage

Detailed explanation of advanced features.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| option1 | string | "default" | Description |
| option2 | boolean | true | Description |

## Troubleshooting

### Common Issues

**Issue 1:** Description of the issue
- Solution step 1
- Solution step 2

## Contributing

Guidelines for contributing to this project.

## License

License information.
`
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Blog post format with intro, body, and conclusion',
    category: 'blog',
    template: `# Blog Post Title

*Published on [Date] by [Author]*

---

## Introduction

Opening paragraph that hooks the reader and introduces the topic.

## Main Content

### Section 1

Content for the first main section. Use paragraphs to organize your thoughts.

### Section 2

Content for the second main section.

### Section 3

Content for the third main section.

## Key Takeaways

- Takeaway 1
- Takeaway 2
- Takeaway 3

## Conclusion

Wrap up the post with final thoughts and call to action.

---

*Tags: tag1, tag2, tag3*
`
  },
  {
    id: 'technical-spec',
    name: 'Technical Specification',
    description: 'Technical specification document with requirements and architecture',
    category: 'technical',
    template: `# Technical Specification: [Project Name]

**Version:** 1.0  
**Date:** [Date]  
**Author:** [Author Name]

---

## Executive Summary

Brief overview of the technical specification.

## Requirements

### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-001 | Description | High | Pending |
| FR-002 | Description | Medium | Pending |

### Non-Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-001 | Performance requirement | High | Pending |
| NFR-002 | Security requirement | High | Pending |

## System Architecture

### Overview

High-level description of the system architecture.

### Components

#### Component 1
- **Purpose:** Description
- **Technology:** Tech stack
- **Dependencies:** List of dependencies

#### Component 2
- **Purpose:** Description
- **Technology:** Tech stack
- **Dependencies:** List of dependencies

## Data Model

\`\`\`
Entity relationships and data structures
\`\`\`

## API Design

### Endpoint 1

\`\`\`http
GET /api/resource
\`\`\`

**Response:**
\`\`\`json
{
  "data": "response"
}
\`\`\`

## Security Considerations

- Security measure 1
- Security measure 2
- Security measure 3

## Performance Requirements

- Response time: < 200ms
- Throughput: 1000 requests/second
- Availability: 99.9%

## Testing Strategy

### Unit Tests
Description of unit testing approach

### Integration Tests
Description of integration testing approach

### Load Tests
Description of load testing approach

## Deployment

### Environment Requirements
- Requirement 1
- Requirement 2

### Deployment Process
1. Step 1
2. Step 2
3. Step 3

## Monitoring and Logging

- Metrics to track
- Logging strategy
- Alert conditions

## Future Considerations

Ideas for future enhancements and scalability.
`
  },
  {
    id: 'api-documentation',
    name: 'API Documentation',
    description: 'REST API documentation with endpoints and examples',
    category: 'api',
    template: `# API Documentation

**Version:** 1.0  
**Base URL:** \`https://api.example.com/v1\`

---

## Authentication

All API requests require authentication using an API key.

\`\`\`http
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### Get Resource

Retrieve a specific resource by ID.

**Endpoint:** \`GET /resources/{id}\`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Resource identifier |

**Request Example:**

\`\`\`bash
curl -X GET "https://api.example.com/v1/resources/123" \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

**Response Example:**

\`\`\`json
{
  "id": "123",
  "name": "Resource Name",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z"
}
\`\`\`

**Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 404 | Resource not found |
| 401 | Unauthorized |

### Create Resource

Create a new resource.

**Endpoint:** \`POST /resources\`

**Request Body:**

\`\`\`json
{
  "name": "Resource Name",
  "description": "Resource description"
}
\`\`\`

**Request Example:**

\`\`\`bash
curl -X POST "https://api.example.com/v1/resources" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Resource Name","description":"Description"}'
\`\`\`

**Response Example:**

\`\`\`json
{
  "id": "124",
  "name": "Resource Name",
  "description": "Resource description",
  "created_at": "2024-01-01T00:00:00Z"
}
\`\`\`

**Status Codes:**

| Code | Description |
|------|-------------|
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |

### Update Resource

Update an existing resource.

**Endpoint:** \`PUT /resources/{id}\`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Resource identifier |

**Request Body:**

\`\`\`json
{
  "name": "Updated Name",
  "description": "Updated description"
}
\`\`\`

**Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 404 | Resource not found |
| 401 | Unauthorized |

### Delete Resource

Delete a resource.

**Endpoint:** \`DELETE /resources/{id}\`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Resource identifier |

**Status Codes:**

| Code | Description |
|------|-------------|
| 204 | No content (success) |
| 404 | Resource not found |
| 401 | Unauthorized |

## Rate Limiting

API requests are rate limited to 1000 requests per hour per API key.

**Headers:**

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
\`\`\`

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
\`\`\`

## Webhooks

Configure webhooks to receive real-time notifications.

**Endpoint:** \`POST /webhooks\`

**Events:**
- \`resource.created\`
- \`resource.updated\`
- \`resource.deleted\`

## SDKs and Libraries

- JavaScript: \`npm install example-api-js\`
- Python: \`pip install example-api-python\`
- Ruby: \`gem install example-api-ruby\`

## Support

For API support, contact: support@example.com
`
  }
];

export const applyTemplate = (template: MarkdownTemplate, existingContent: string): string => {
  // If there's existing content, ask user or merge intelligently
  // For now, we'll replace with the template
  return template.template;
};

export const getTemplatesByCategory = (category: MarkdownTemplate['category']) => {
  return markdownTemplates.filter(t => t.category === category);
};
