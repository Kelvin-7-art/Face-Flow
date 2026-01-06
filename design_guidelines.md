# Face Recognition Attendance System - Design Guidelines

## Design Approach
**System Selected**: Material Design-inspired approach optimized for data-heavy admin interfaces
**Rationale**: Utility-focused attendance tracking application requiring clarity, efficiency, and strong information hierarchy

## Typography System
**Font Families**: 
- Primary: Inter or Roboto via Google Fonts CDN
- Monospace: JetBrains Mono for person IDs and technical data

**Hierarchy**:
- Page Headers: 2rem (text-2xl), semibold
- Section Titles: 1.5rem (text-xl), medium
- Card Titles: 1.125rem (text-lg), medium
- Body Text: 1rem (text-base), normal
- Small/Meta: 0.875rem (text-sm), normal
- Stats/Numbers: 2.5rem (text-4xl), bold

## Spacing System
**Core Units**: Use Tailwind spacing of 2, 4, 6, 8, 12, 16
- Component padding: p-6 to p-8
- Section gaps: gap-6 to gap-8
- Card spacing: p-6
- Form field spacing: space-y-4
- Page margins: px-4 md:px-8, py-8

## Layout Architecture

**Navigation**:
- Horizontal navbar with logo left, nav links center/right
- Height: h-16
- Sticky positioning (sticky top-0)
- Links: Home | Register | Attendance | Logs | People

**Container Structure**:
- Max-width: max-w-7xl mx-auto
- Page padding: px-4 md:px-8 py-8

**Grid Systems**:
- Dashboard stats: grid-cols-1 md:grid-cols-3 gap-6
- People management: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Forms: Single column, max-w-2xl

## Core Components

**Dashboard Cards** (Stats Display):
- Elevated cards with subtle shadow
- Padding: p-8
- Icon + large number + label structure
- Icons: Font Awesome icons via CDN (fa-users, fa-calendar-check, fa-user-clock)

**Camera Preview Box**:
- Aspect ratio: 4:3 or 16:9
- Rounded corners: rounded-lg
- Max-width: max-w-2xl
- Border treatment for active/inactive states
- Centered within container

**Form Elements**:
- Input fields: Full width with height h-12
- Labels: text-sm font-medium, mb-2
- Generous touch targets: min-height 44px for all interactive elements
- Helper text: text-sm, mt-1
- Error states: Red accent border + text

**Tables** (Logs/People):
- Full-width responsive table
- Striped rows (alternating background)
- Header: Sticky with font-medium
- Cell padding: px-6 py-4
- Hover state on rows
- Mobile: Stack to cards below md breakpoint

**Buttons**:
- Primary action: Large (h-12), rounded-lg, font-medium
- Secondary: Outlined variant
- Danger (delete): Red variant
- Icon buttons: Square (w-10 h-10) for actions
- File upload: Custom styled with icon

**Recognition Results Display**:
- Card-based layout for each detected face
- Show: Name, Person ID, confidence/distance, timestamp
- Visual indicator: Check icon for recognized, X for unknown
- Bounding box visualization overlay on camera preview

**Status Indicators**:
- Badges for attendance status (Present/Absent)
- Pills: rounded-full px-3 py-1 text-sm
- Live camera status: Small indicator dot

## Page-Specific Layouts

**Home/Dashboard**:
- Hero section with system title and description (py-12)
- 3-column stats grid
- Quick action buttons below stats

**Register Page**:
- Two-column layout (md:grid-cols-2): Camera preview left, form right
- Progress indicator for sample collection (1/20)
- Upload zone with drag-drop indication

**Attendance Page**:
- Camera preview centered at top
- Threshold slider below preview (with value display)
- Recognition results grid below (max-w-4xl)

**Logs Page**:
- Filter controls in horizontal card at top
- Export CSV button (top-right)
- Table below with pagination indicators

**People Management**:
- Grid of people cards (3 columns on desktop)
- Each card: Profile placeholder, name, ID, delete button
- Search/filter bar at top

## Interaction Patterns
- Loading states: Spinner overlays during processing
- Success feedback: Checkmark animation for attendance marked
- Toast notifications: Top-right for actions (attendance marked, person deleted)
- Modal confirmation for destructive actions (delete person)

## Images Section
**No large hero image required** - This is a functional admin tool, not a marketing site
**Camera preview placeholders**: Gray background with camera icon when inactive
**Profile placeholders**: Generic avatar icon for people without photos
**Recognition visualization**: Bounding boxes overlaid on camera feed (semi-transparent rectangles)

## Accessibility
- ARIA labels for all icon-only buttons
- Focus indicators: 2px outline on all interactive elements
- Keyboard navigation support for all actions
- Form validation with clear error messages
- Consistent tab order across all pages