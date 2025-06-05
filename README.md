# Museum Collection Explorer - Project Summary

## Overview

A React application allowing users to search museum and gallery collections supplied by two aggregator services; Smithsonian and Europeana. Collectively covering over 3000 institutions and millions of archive entries. Users can search items, create collections and save items into collections to view later.

Catering to designers, artists and researchers, it employs an image-centric approach; pre-filtering results without valid image URLS or CCO licensing so that user see only visually-engaging and useable results. The aim was to balance depth of search with a smooth and responsive user experience, opting for quality over quantity of results.

The app is live at: https://cura-sand.vercel.app/

## Project Architecture

### Technology Stack

- **Frontend**: React.js with React Router for navigation
- **Styling**: Tailwind CSS for utility-based styling
- **State Management**: React Context Providers for global state
- **API Integration**: Axios for HTTP requests, Express proxy server for Smithsonian API
- **Building/Bundling**: Vite
- **Environment Management**: dotenv for environment variables

### Application Structure

```
.
├── README.md                           # Project documentation
├── eslint.config.js
├── index.html                          # Vite entry point
├── package.json                        # Dependencies & scripts
├── server.js                           # Express proxy for Smithsonian API
├── src
│   ├── App.jsx                         # Main app component & routing
│   ├── api
│   │   ├── adapters                    # Transform API responses to unified format
│   │   ├── config.js                   # API endpoints & request parameters
│   │   ├── museumService.js           # Orchestrates API calls & caching
│   │   └── repositories               # Direct API communication layer
│   ├── components
│   │   ├── collections                # User collection management UI
│   │   ├── common                     # Reusable UI components
│   │   ├── layout                     # App structure & custom masonry grid
│   │   └── search                     # Search interface & results display
│   ├── context                        # React state management providers
│   ├── pages                          # Route components
│   ├── styles                         # Global CSS
│   └── utils                          # Helper functions, data processing and caching
├── tailwind.config.js                 # Tailwind CSS configuration
└── vite.config.js                     # Vite build configuration

```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/m1k3wn/nc-curation-platform.git
   cd nc-curation-platform
   ```
2. **Install Dependencies**

   ```
   npm install
   ```

3. **Environment variables**
   Create a .env file in root directory with:

   ```
   VITE_EUROPEANA_API_KEY=your_europeana_key
   ```

   To generate a Europeana API key visit: https://apis.europeana.eu/en

   To generate a Smithsonian API key visit: https://api.data.gov/signup/

   (Existing Smithsonian API Key already securely connected to Server.js - deployed seperately)

## API Integration

A modular architecture allows future APIs to be integrated into the existing functionality by adding a Repository, Adapter and updating /api/config and /museumService.

### Europeana

Europeana offers multiple APIs for different uses. Here we use 'Search' for searching collections. 'Record' for retrieving a single item's full metadata and 'Thumbnails' for fetching consistent thumbnail images.

Service outages do happen. If you are seeing placeholder images or broken links, check the API's respective status at:
https://status.europeana.eu/
Full developer docs can be found at: https://status.europeana.eu/

### Smithsonian

Single item details are fetched via /api/smithsonian/content/:itemID`

Searches across all collections are handled via /api/smithsonian/search, {searchParams}

Sparse documentation, deeply nested and extremely varied response formats and lack of CORS support made this a challenging but rewarding service to integrate. Some developer documentation can be found at: https://edan.si.edu/openaccess/apidocs/

#### Smithsonian Server

A simple Node.js Express server (`server.js`) acts as a proxy for the Smithsonian API, handling:

- API key management
- Request routing
- Error handling
- Response formatting

This is done as the Smithsonian API has not enabled CORS (Cross-Origin Resource Sharing) for client-side requests.

The server is hosted seperately from main app via Render.

Healtcheck endpoint can be visited at: https://nc-curation-platform.onrender.com/

## Key Features

### 1. Search System

The search functionality is implemented through several coordinated components:

- **SearchContext**: Manages search state, pagination, and API requests
- **SearchBar**: UI component for user input
- **SearchResultsPage**: Parent component for results, handles filtering and sorting
- **SearchResultsGrid**: Displays results in a responsive custom Masonry grid (/layout/MasonryGrid.jsx)
- **ItemCard**: Reusable card component to display item previews in search results and collections
- **FilterMenu**: Renders DateFilter and DateSort to handle filtering and sorting of results
- **Pagination**: Handles page navigation for large result sets
- **SearchProgress** + **SearchInfo**: Handle progress callbacks and give basic updates to user during searches
- **SearchResultsManager**: Handles localStorage caching of recent searches and results

Requests to both APIs are co-ordinated behind the scenes, giving the user a smooth unified experience and results.

### 2. Item Details

Individual item details are displayed through:

- **ItemPage**: Container for single item view
- **SingleItemCard**: Detailed display of item information
- **ImageZoomModal**: Allows zooming of high-res imge urls where available
- **BrokenImag**: Handles instances where high-resolution image URLs are broken or incorrectly supplied by the source institution.

### 3. User Collections

A user's saved collections are displayed through:

- **CollectionsPage**: Page displaying all current User's collections
- **CollectionCard**: Shows preview of items contained within a collection
- **CollectionView**: Parent component for viewing a single collection
- **ItemCard + SingleItemCard**: Reusable components for an item summary or detailed view, as in search results
- **CollectionModal**: Popup modal for creating and editing collections
- **AddToCollectionButton**: Reusable button component which launches a modal for adding items to collections

### 4. API Integration

The application uses a layered architecture for API interactions.

Key request parameters are defined centrally in /api/config.js

1. **Repository Layer** (smithsonianRepository.js / europeanaRepository.js):

   - Direct API communication (proxy server for Smithsonian)
   - Request/response handling
   - Error management
   - Request cancellation support

2. **Adapter Layer** (smithsonianAdapter.js / europeanaAdapter.js):

   - Data transformation from API format to app format
   - Field extraction and normalisation
   - Consistent structure creation
   - Fallback handling for missing data

3. **Service Layer** (museumService.js):

   - Orchestrates repository and adapter calls
   - Handles higher-level operations (search batching)
   - Provides a unified interface for the UI
   - Source-specific implementation routing (e.g., Smithsonian vs. Europeana)

### 5. Handling Searches

The application implements an asynchronous, batched system to handle searches:

1. Unified search function routes requests to Smithsonian and Europeana repositories respectively
2. Europeana results returned immediately for responsive UX
3. Smithsonian results fetched asyncronously and appended to total results (as their API is much slower)
4. Smithsonian requests are batched, Europeana requests are capped to a managebale amount. All defined in config.js
5. Basic Progress updates are provided to the user
6. Adapter layer formats raw responses to unified format before sending to UI components
7. Formatted results are individually cached

### 5. Caching

(/utils/museumService.js)

- Handles caching of results from both APIs
- Stores results from most recent searches
- Checks cache for \<searchTerm\> before performing a new fetch request
- Uses pro-active memory clearance and localStorage quota checks

## State Management

The application uses React Context Providers for state management:

1. **SearchContext**:

   - Manages current search query, results, pagination
   - Handles loading/error states
   - Coordinates API requests and caching
   - Provides methods like performSearch, loadMore, changePage

2. **AuthContext**

   - Will handle user authentication state
   - Currently provides basic isAuthenticated and currentUser values

3. **CollectionsContext**
   - Manages user collections of saved items
   - Ready for migration to Firebase backend

## Error Handling and Edge Cases

1. **API Request Errors**:

   - Specific error messages for different failure types
   - Fallback UI states for failed requests
   - Request cancellation for race conditions

2. **Data Inconsistencies**:

   - Multiple fallback strategies for missing/incorrectly formatted data
   - Default values and placeholders
   - Null/undefined checks throughout
   - Multiple fallbacks for retrieving images of various sizes

3. **Cache Management**:
   - Safe localStorage access with try/catch handling
   - Cache corruption detection and proactive cleanup
   - Quota management strategies

## Key Technical Challenges

Creating a unified and coherent user experience was a fascinating challenge. A key consideration was how to provide meaningful and interesting results from such vast collections, without overwhelming a user. Pre-filtering results for items with images and at least some metadata ensures that users see only engaging and useful results. Extensive extraction functions comb the raw responses from both APIs for key information including creators, location, notes, descriptions, identifiers and dates. English language metadata is prioritised, falling back to default langauge ('def').

1. **Efficient Search Result Processing**:

   - Batch processing for large result sets
   - Asynchronous background loading
   - Progress indication
   - Progressive rendering
   - Local caching

2. **Consistent Data Structure**:

   - Adapting varied API responses to consistent format
   - Accounting for rendering freetext data categories (ie. artist/creator/manufacturer/publisher)
   - Fallback strategies for incomplete data
   - Support for both single-item and list views
   - Storing multiple image URLs for a variety of image sizes where possible
   - Managing incorrectly-formatted uploads from original sources
   - Cleaning HTML tags and standardising wildly inconsitent data formats

3. **Interface Design**:

   - Image-based design, prioritising clean and uncluttered browsing
   - Custom masongry grid and image zoom modals
   - Unnecessary complexity/options abstracted out from user choices
   - Loading states throughout
   - Responsive sizing
   - Centralised Tailwind classes make all typefaces and colour palettes extremely modular

## Support

This project was made possible by the amazing folks at Tech Returners - a part of the NorthCoders group. To find out more visit:

https://www.techreturners.com/

https://www.northcoders.com/
