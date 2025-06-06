# LLM/AI Integration in Migo Marketplace

This document describes how Large Language Model (LLM) and AI integration works in the Migo Marketplace web application.

## Overview

Migo Marketplace integrates Google's Gemini AI to provide an intelligent conversational assistant called "Ask Migo" that helps users discover and connect with local service providers. The AI assistant acts as a personalized guide for service discovery and business interaction.

## Core Features

### 1. **Ask Migo AI Assistant**

- **Purpose**: Intelligent conversational interface for service discovery
- **Functionality**: Provides personalized recommendations, business connections, and service quotes
- **Location**: Available on the homepage and as a dedicated `/ask-migo` page

### 2. **Business Impersonation**

- **Purpose**: AI acts as different local businesses to provide quotes and information
- **Functionality**: Dynamically assumes the identity of selected service providers
- **Context**: Uses business-specific data (name, owner, address, reviews) for realistic interactions

### 3. **Service Recommendation Engine**

- **Purpose**: Suggests relevant services based on user queries
- **Functionality**: Matches user needs with available service categories
- **Integration**: Combines dummy data with real map search results

## Technical Implementation

### AI Provider: Google Gemini

**Model**: `gemini-2.0-flash`
**Library**: `@google/genai` (version 1.3.0)

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.REACT_APP_GOOGLE_GEMINI_API_KEY,
});
```

### Configuration

#### Environment Variables

```bash
# Frontend (.env)
REACT_APP_GOOGLE_GEMINI_API_KEY=AIzaSyA-0z2YswuitYnwdKADVnQKCg1MNRq9Pjg
```

#### Dependencies

```json
{
  "dependencies": {
    "@google/genai": "^1.3.0",
    "react-markdown": "^8.0.0"
  }
}
```

### Key Components

#### 1. AskMigo Page (`/frontend/src/pages/AskMigo.js`)

- **Primary AI Interface**: Full-featured conversational experience
- **Guided Workflow**: Step-by-step service discovery process
- **Business Simulation**: AI impersonates selected businesses

#### 2. Home Page Chat Widget (`/frontend/src/pages/Home.js`)

- **Quick Access**: Floating chat button for immediate assistance
- **Basic Functionality**: Simplified interface for common queries
- **UI Integration**: Seamlessly integrated into homepage design

## AI Workflow

### 1. **Initial Service Discovery**

```
User Query → AI Analysis → Service Recommendations → Business Matching
```

### 2. **Guided Interaction Process**

1. **Step 0**: User selects service type from predefined categories
2. **Step 1**: AI recommends businesses offering selected service
3. **Step 2**: AI impersonates selected business for direct interaction

### 3. **Business Impersonation Flow**

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `You are ${serviceInfo.name}, a ${serviceInfo.service} provider. 
             Owner: ${serviceInfo.ownerName}. 
             Address: ${serviceInfo.address}. 
             Phone: ${serviceInfo.phone}. 
             You have ${serviceInfo.ratingsCount} reviews with an average rating of ${serviceInfo.ratingValue}. 
             Please provide a short, human-like quote and any additional details to a potential client.`,
});
```

## Data Sources

### 1. **Service Types** (`/constants/serviceTypes.js`)

```javascript
export const serviceTypes = [
  "Catering",
  "Cleaning",
  "Plumbing",
  "Electrical",
  "Landscaping",
  "Painting",
  "Baked Goods",
  "Decorating",
  "DJ Services",
  "Photography",
  "Pest Control",
  "Moving Services",
  "Pet Care",
  "Tutoring",
];
```

### 2. **Dummy Business Data** (`/constants/dummyServices.js`)

- **Location**: All businesses located at Santa Clara University
- **Data Structure**: Name, service type, owner, address, phone, ratings
- **Purpose**: Provides realistic business context for AI interactions

### 3. **Real-time Map Integration**

- **Source**: Google Maps API integration
- **Purpose**: Supplements dummy data with actual local businesses
- **Integration**: Combined with AI recommendations for comprehensive results

## Context Management

### AI Context Building

```javascript
const context = `Available services in Santa Clara, CA: ${currentServices.join(
  ", "
)}.
Businesses offering these services: ${dummyServices
  .map((s) => `${s.name} (${s.service})`)
  .join(", ")}.`;

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `${context}\nUser input: ${userInput}\n\nPlease keep your response short and human-like.`,
});
```

### Business Context Injection

- **Dynamic Role Assignment**: AI assumes specific business identity
- **Contextual Information**: Includes business details, reviews, and ratings
- **Realistic Interactions**: Provides quotes and business-specific responses

## User Interface Features

### 1. **Chat Interface**

- **Message Bubbles**: Distinct styling for user and AI messages
- **Typing Indicators**: Visual feedback during AI processing
- **Markdown Support**: Rich text formatting for AI responses

### 2. **Guided Options**

- **Service Selection**: Interactive buttons for service categories
- **Business Selection**: Dynamic options based on service choice
- **Progressive Disclosure**: Step-by-step workflow management

### 3. **Controls**

- **Clear Chat**: Reset conversation history
- **Start Over**: Return to guided workflow beginning
- **Send Message**: Free-form text input for custom queries

## Error Handling

### API Error Management

```javascript
try {
  const response = await ai.models.generateContent({...});
  // Process successful response
} catch (error) {
  console.error("Error interacting with Gemini API:", error);
  const errorMessage = {
    sender: "bot",
    text: "Sorry, we couldn't process your request. Please try again later.",
  };
  setMessages((prevMessages) => [...prevMessages, errorMessage]);
}
```

### Graceful Degradation

- **Fallback Messages**: User-friendly error messages
- **Retry Mechanism**: Users can attempt requests again
- **Logging**: Detailed error logging for debugging

## Performance Considerations

### 1. **Debounced Interactions**

- **Typing Indicators**: Prevent multiple simultaneous requests
- **Request Queuing**: Manage API call frequency

### 2. **Context Optimization**

- **Efficient Prompts**: Concise context building
- **Response Caching**: Minimize redundant API calls

### 3. **User Experience**

- **Loading States**: Visual feedback during processing
- **Progressive Enhancement**: Fallback for failed requests

## Security & Privacy

### 1. **API Key Management**

- **Environment Variables**: Secure key storage
- **Frontend Exposure**: API key accessible in client-side code (consider backend proxy for production)

### 2. **Data Handling**

- **No Persistent Storage**: Conversations not permanently stored
- **Local State Management**: Messages stored in component state only

### 3. **Content Filtering**

- **Business Context**: Controlled AI responses through business impersonation
- **Error Boundaries**: Graceful handling of inappropriate content

## Integration Points

### 1. **Map Integration**

```javascript
import { handleSearch } from "../pages/MapPage";

// Combine AI recommendations with map search
const searchResults = await handleSearch(selectedService);
setMapResults(searchResults);
```

### 2. **Service Discovery**

- **Category Browsing**: Links to service category pages
- **Business Profiles**: Connection to vendor profiles
- **Booking Integration**: Potential for direct booking flows

## Development Workflow

### 1. **Local Development**

- **API Key Setup**: Configure environment variables
- **Dummy Data**: Use predefined business data for testing
- **Debug Mode**: Console logging for development

### 2. **Testing Considerations**

- **API Limits**: Monitor Gemini API usage
- **Response Validation**: Test various user inputs
- **Error Scenarios**: Test network failures and API errors

## Future Enhancements

### 1. **Advanced Features**

- **Multi-language Support**: Localized AI responses
- **Voice Integration**: Speech-to-text and text-to-speech
- **Booking Integration**: Direct service booking through AI

### 2. **Performance Optimizations**

- **Backend Proxy**: Secure API key management
- **Response Caching**: Improve response times
- **Context Persistence**: Maintain conversation across sessions

### 3. **Analytics Integration**

- **Usage Tracking**: Monitor AI interaction patterns
- **Conversation Analytics**: Improve AI responses based on usage
- **Business Intelligence**: Insights from user service requests

## Conclusion

The AI integration in Migo Marketplace provides a sophisticated conversational interface that bridges the gap between users and local service providers. By combining Google's Gemini AI with contextual business data and guided workflows, the system creates an intuitive and engaging user experience for service discovery and business interaction.

The implementation demonstrates practical AI application in marketplace scenarios, with room for future enhancements in areas such as multi-language support, voice integration, and advanced analytics.
