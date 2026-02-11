# Deep Links Documentation

This document contains all supported deep links in the Family App Engagement application.

## Scheme

All deep links start with the following scheme:
```
familyappengagement://
```

## Supported Deep Links

### 1. Open Chat

**Format:**
```
familyappengagement://chat/{chatID}
```

**Parameters:**
- `chatID` (required): Unique identifier for conversation/group

**Example:**
```
familyappengagement://chat/123e4567-e89b-12d3-a456-426614174000
```

**App Route:**
- `/chat/[chatID]`

---

### 2. Open Contact Profile

**Format:**
```
familyappengagement://contact/{userId}?name={name}&role={role}&image={imageUrl}
```

**Parameters:**
- `userId` (required): User identifier
- `name` (optional): User name
- `role` (optional): User role
- `image` (optional): Profile image URL

**Example:**
```
familyappengagement://contact/123e4567-e89b-12d3-a456-426614174000?name=John%20Doe&role=Parent&image=https://example.com/avatar.jpg
```

**App Route:**
- `/contact-profile/[userId]`

---

### 3. Open Group Profile

**Format:**
```
familyappengagement://group/{chatID}
```

**Parameters:**
- `chatID` (required): Unique identifier for group

**Example:**
```
familyappengagement://group/123e4567-e89b-12d3-a456-426614174000
```

**App Route:**
- `/group-profile/[chatID]`

---

### 4. Open Event

**Format:**
```
familyappengagement://event/{id}
```

**Parameters:**
- `id` (required): Unique identifier for event

**Example:**
```
familyappengagement://event/123e4567-e89b-12d3-a456-426614174000
```

**App Route:**
- `/event/[id]`

---

### 5. Open Resource

**Format:**
```
familyappengagement://resource/{id}
```

**Parameters:**
- `id` (required): Unique identifier for resource

**Example:**
```
familyappengagement://resource/123e4567-e89b-12d3-a456-426614174000
```

**App Route:**
- `/resource/[id]`

---

### 6. Open Feed Post

**Format:**
```
familyappengagement://feed/{id}
```

**Parameters:**
- `id` (required): Unique identifier for post

**Example:**
```
familyappengagement://feed/123e4567-e89b-12d3-a456-426614174000
```

**App Route:**
- `/feed/[id]`

---

### 7. Open User Profile

**Format:**
```
familyappengagement://profile/{userId}
```

**Parameters:**
- `userId` (required): User identifier

**Example:**
```
familyappengagement://profile/123e4567-e89b-12d3-a456-426614174000
```

**App Route:**
- `/user-profile`

---

## Backend Usage

### Example: Sending Chat Link in Notification

```json
{
  "title": "New Message",
  "body": "You have a new message",
  "data": {
    "type": "message",
    "deepLink": "familyappengagement://chat/123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Example: Sending Event Link in Email/SMS

```html
<a href="familyappengagement://event/123e4567-e89b-12d3-a456-426614174000">
  View Event
</a>
```

### Example: QR Code for Group Invitation

```
familyappengagement://group/123e4567-e89b-12d3-a456-426614174000
```

---

## Important Notes

1. **URL Encoding**: When using query parameters, always use URL encoding:
   - Space: `%20`
   - `&`: `%26`
   - `#`: `%23`
   - etc.

2. **Authentication**: Users must be logged in before using deep links. If not logged in, users will be redirected to the login page, and after successful login, the deep link will be executed.

3. **Validation**: The application automatically validates routes. If a route is invalid, a warning message will be displayed in the console.

4. **Fallback**: If a deep link is not recognized, no navigation will occur and a warning message will be displayed.

---

## Testing Deep Links

### iOS (Simulator)

```bash
xcrun simctl openurl booted "familyappengagement://chat/123"
```

### Android (Emulator/Device)

```bash
adb shell am start -W -a android.intent.action.VIEW -d "familyappengagement://chat/123" com.familyapp.engagement
```

### Via Browser (Development)

In mobile or desktop browser:
```
familyappengagement://chat/123
```

---

## Related File Structure

- **Parser**: `utils/deep-linking.ts`
- **Handler**: `app/_layout.tsx`
- **Configuration**: `app.json`

---

## Complete Backend Examples

### 1. Group Invitation Link

```javascript
const groupId = "123e4567-e89b-12d3-a456-426614174000";
const inviteLink = `familyappengagement://group/${groupId}`;

// Send via SMS
sendSMS({
  to: "+1234567890",
  message: `Join our group: ${inviteLink}`
});

// Send via Email
sendEmail({
  to: "user@example.com",
  subject: "Group Invitation",
  html: `<a href="${inviteLink}">Click to join the group</a>`
});
```

### 2. Event Link in Notification

```javascript
const eventId = "123e4567-e89b-12d3-a456-426614174000";
const deepLink = `familyappengagement://event/${eventId}`;

sendPushNotification({
  userId: "user123",
  title: "New Event",
  body: "A new event has been created for you",
  data: {
    type: "event",
    eventId: eventId,
    deepLink: deepLink
  }
});
```

### 3. Contact Profile Link with Additional Parameters

```javascript
const userId = "123e4567-e89b-12d3-a456-426614174000";
const name = encodeURIComponent("John Doe");
const role = encodeURIComponent("Parent");
const imageUrl = encodeURIComponent("https://example.com/avatar.jpg");

const deepLink = `familyappengagement://contact/${userId}?name=${name}&role=${role}&image=${imageUrl}`;
```

### 4. Chat Link in Webhook

```javascript
// When a new message is sent in a group
app.post('/webhook/new-message', (req, res) => {
  const { conversationId, message } = req.body;
  
  // For each group member who is not online
  conversation.members.forEach(member => {
    if (!member.isOnline) {
      const deepLink = `familyappengagement://chat/${conversationId}`;
      
      sendPushNotification({
        userId: member.id,
        title: conversation.name,
        body: message.text,
        data: {
          type: "message",
          conversationId: conversationId,
          deepLink: deepLink
        }
      });
    }
  });
  
  res.json({ success: true });
});
```

---

## Summary Table

| Type | URL Format | App Route | Required Parameters |
|------|-----------|-----------|---------------------|
| Chat | `familyappengagement://chat/{chatID}` | `/chat/[chatID]` | `chatID` |
| Contact | `familyappengagement://contact/{userId}` | `/contact-profile/[userId]` | `userId` |
| Group | `familyappengagement://group/{chatID}` | `/group-profile/[chatID]` | `chatID` |
| Event | `familyappengagement://event/{id}` | `/event/[id]` | `id` |
| Resource | `familyappengagement://resource/{id}` | `/resource/[id]` | `id` |
| Feed | `familyappengagement://feed/{id}` | `/feed/[id]` | `id` |
| Profile | `familyappengagement://profile/{userId}` | `/user-profile` | `userId` |

---

## Frequently Asked Questions

**Q: Can I use HTTP/HTTPS scheme?**
A: No, currently only `familyappengagement://` is supported.

**Q: What happens if the user is not logged in?**
A: The user will be redirected to the login page, and after successful login, the deep link will be executed.

**Q: Can I add multiple query parameters?**
A: Yes, for contact profile you can add `name`, `role`, and `image`. For other routes, only the ID is required.

**Q: Do deep links work on web as well?**
A: No, deep links only work in the native app (iOS and Android).

---

## Support

If you encounter any issues or need to add a new deep link, please contact the development team.
