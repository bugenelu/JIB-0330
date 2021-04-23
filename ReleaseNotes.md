# Release Notes
## v 1.0

### Features

_User Features_
 - Users navigate a branching path by answering questions about their business and interests to discover resources and media related to sustainable business practices.
 - Users can favorite any page for immediate access later.
 - Users can access previous stories from a 'History' page under 'Profile'.
 - Users may present a slideshow of their story from the 'History' page.
 - Users can update their profile as needed.

_Admin Features_
 - Admins can upload and maintain media for distribution to users.
 - Admins can create and edit story engines with a full suite of content creation tools under 'Editor'.
    - Admins can set the Live Engine, which defines which engine the users explore.
    - Admins can export and import engine data for archiving or direct editing.
    - Admins can use the built-in content creation tools to create engines, pages in engines, content for pages, and navigable structure in an engine.
 - Admins can manage user and admin accounts.

### Known Issues

- Database: If a user's account is _directly edited_ on Firebase, the application may not reflect the change to the user's information. Avoid directly editing user information in the database.
- Editor: Engines must be saved to the database with a name that matches the 'story_id' of the Engine. In some cases, it has been demonstrated that it is possible to circumnavigate this rule. However, the exact steps taken to get to this result could not be determined.
- Editor: Undetermined circumstances occasionally cause an open engine to produce multiple open tabs in the editor UI. Closing all engines causes duplicate tabs to go away. Be sure to save work before closing an engine to remedy this bug.