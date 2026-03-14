# NutriScan - Food Nutrition Scanner App

## 1. Project Overview

**Project Name**: NutriScan  
**Type**: Mobile Application (React Native with Expo)  
**Core Functionality**: A food nutrition scanner app that allows users to scan barcodes or manually search for food items, view detailed nutrition information, and receive health ratings based on nutrient thresholds.

## 2. Technology Stack & Choices

- **Framework**: React Native with Expo SDK 52
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + useReducer for global state (scan history, favorites)
- **UI Components**: Custom components with React Native built-in components
- **Barcode Scanning**: expo-camera with barcode scanning
- **Data Storage**: AsyncStorage for local persistence of scan history
- **Food Data API**: Open Food Facts API (free, open-source)
- **Architecture**: Clean Architecture (Presentation / Domain / Data layers)

## 3. Feature List

1. **Home Screen**
   - "Scan Barcode" button with camera icon
   - "Search Manually" button with search icon
   - Recent scan history (last 5 items)
   - Quick stats (total scans today)

2. **Barcode Scanner**
   - Camera-based barcode scanning
   - Auto-fetch product on successful scan
   - Flash toggle for low-light scanning
   - Manual barcode entry fallback

3. **Product Search**
   - Text search input
   - Real-time search results from Open Food Facts API
   - Debounced search (300ms)
   - Loading states and empty states

4. **Product Detail Screen**
   - Product image display
   - Product name and brand
   - Nutrition facts table (calories, protein, carbs, fat, sugar, sodium, saturated fat)
   - Health rating badge (Good/Fair/Avoid)
   - Save to history button
   - AI explanation of health rating

5. **Health Rating Logic**
   - **Good**: Low sugar (<5g), low sodium (<400mg), low saturated fat (<2g)
   - **Fair**: Medium levels (sugar 5-15g, sodium 400-800mg, saturated fat 2-4g)
   - **Avoid**: High sugar (>15g), high sodium (>800mg), high saturated fat (>4g)
   - Overall rating based on worst nutrient

6. **Scan History**
   - List of all scanned/searched products
   - Timestamp for each scan
   - Tap to view details
   - Clear history option

## 4. UI/UX Design Direction

- **Color Scheme**:
  - Primary: Fresh Green (#22C55E)
  - Secondary: Ocean Blue (#0EA5E9)
  - Background: Clean White (#FFFFFF)
  - Surface: Light Gray (#F8FAFC)
  - Text: Dark Slate (#1E293B)
  - Rating Colors: Good (#22C55E), Fair (#F59E0B), Avoid (#EF4444)

- **Typography**:
  - Headings: Bold, 24-32px
  - Body: Regular, 16px
  - Captions: Light, 12-14px

- **Layout**:
  - Bottom tab navigation (Home, History)
  - Card-based UI for products
  - Full-width buttons for primary actions
  - Safe area handling for notches

- **Accessibility**:
  - Minimum touch target 44x44px
  - Color contrast ratio 4.5:1 minimum
  - Screen reader labels on all interactive elements
  - Focus indicators

## 5. API Integration

- **Open Food Facts API**: https://world.openfoodfacts.org/api/v2/
  - Product by barcode: `/product/{barcode}.json`
  - Search: `/search?search_terms={query}&page_size=20`
