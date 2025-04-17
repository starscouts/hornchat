# Hornchat Roadmap

> **Completion:** 37/58

- [x] <s>Refactor serverside to make it easier to bugfix</s>
- [x] <s>Device manager on client</s>
- [x] <s>Option to show safety number on client</s>
- [ ] Consider switches as conversation events (client)
- [ ] Limit file uploads to 10MB (client)
- [ ] Show message send status instead of hanging (client)
- [ ] Rate limit for sending messages
- [ ] Drag and drop, and paste
- [ ] Limit to 5000 characters (client)

- [ ] Modular server
  - [x] <s>`public:/api/authentication`: user ID + TOTP authentication; and device token verification</s>
  - [ ] `public:/api/conversation`: service for everything chat-related
  - [x] <del>`public:/api/keyserver`: service to exchange public keys</del>
  - [x] <del>`public:/api/profile`: service for user profile management</del>
  - [x] <del>`public:/api/status`: service for status management</del>
  - [x] <del>`public:/api/verification`: service for safety number verification</del>
  - [x] <del>`pluralkit:/refresh`: service to update PluralKit data</del>

- [x] <del>End-to-end encryption</del>
  - [x] <del>Per-device keypair</del>
  - [x] <del>Asymmetric encryption (private and public keys)</del>

- [x] <del>PluralKit integration</del>
  - [x] <del>Different bubble colors for different senders</del>
  - [x] <del>Fetching information as often as possible</del>
    - [x] <del>Update current fronter as often as possible</del>
    - [x] <del>Fetch member information frequently</del>
  - [x] <del>Prefix overrides current fronter</del>
  - [x] <del>Handle PluralKit being down</del>
    - <del>The app should still work as intended even when PluralKit is temporarily unavailable.</del>

- [ ] Conversation events
  - [x] <s>Replies</s> 
  - [ ] Messages
    - [x] <s>Text message</s>
      - [x] <s>Markdown support</s>
    - [ ] File message
      - [ ] Photo
      - [ ] Video
      - [ ] Audio
      - [ ] Text/code
      - [x] <s>Other files</s>
  - [x] <s>Read receipts</s>
  - [x] <s>Typing</s>
    - [x] <s>Start typing</s>
    - [x] <s>Stop typing</s>
    - [x] <s>Real-time preview</s>

- [x] <del>Security measures</del>
  - [x] <del>Safety number changes every time a new device logs in</del>
  - [x] <del>User can delete devices from account</del>
  - [x] <del>Rate-limiting</del>

- [x] <s>Profile and status</s>
  - [x] <del>Username</del> **(not needed because of PluralKit)**
  - [x] <del>Profile picture</del> **(not needed because of PluralKit)**
  - [x] <del>Update dynamically with PluralKit</del>
  - [x] <s>Status</s>
    - [x] <s>Online</s>
    - [x] <s>Offline</s>

- [ ] Background functionality
  - [ ] Message syncing
  - [ ] Status on mobile
  - [ ] Notifications