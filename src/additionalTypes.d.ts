declare global {
  // Internal Declarations
  type RealishAssignment =
    'unassigned'
    | 'alumni-company'
    | 'alumni-school'
    | 'article-title'
    | 'attendees'
    | 'avatar-company'
    | 'avatar-company-media'
    | 'avatar-event'
    | 'avatar-group'
    | 'avatar-newsletter'
    | 'avatar-person'
    | 'avatar-product'
    | 'avatar-school'
    | 'avatar-service'
    | 'company'
    | 'company-media'
    | 'connections'
    | 'connections-mutual'
    | 'country'
    | 'date'
    | 'dateShort'
    | 'dateTime'
    | 'degree-badge'
    | 'domain'
    | 'event'
    | 'email'
    | 'followers'
    | 'group'
    | 'industry'
    | 'job-title'
    | 'location'
    | 'members'
    | 'name'
    | 'product'
    | 'profile-headline'
    | 'published-frequency'
    | 'school'
    | 'service'
    | 'timestamp';

  type RealishFilteredShapeNodes =
    EllipseNode
    | PolygonNode
    | RectangleNode
    | StarNode
    | ComponentNode
    | InstanceNode
    | FrameNode;

  type RealishFilteredNodes =
    TextNode
    | RealishFilteredShapeNodes;

  // Vendor Declarations
  const selectMenu: window.selectMenu

  // Figma’s typings in npm package @figma/plugin-typings
} // declare global

export {}
