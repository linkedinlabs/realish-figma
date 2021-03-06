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
    ComponentNode
    | EllipseNode
    | FrameNode
    | InstanceNode
    | PolygonNode
    | RectangleNode
    | StarNode;

  type RealishFilteredNodes =
    RealishFilteredShapeNodes
    | TextNode;

  // Vendor Declarations
  
  // for attaching Svelte to window global
  interface Window {
    app: Function;
  }

  // Figma’s typings in npm package @figma/plugin-typings
} // declare global

export {}
