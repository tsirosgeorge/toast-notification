# 🔔 ToastNotification

A lightweight, customizable, and dependency-free toast notification system written in vanilla JavaScript.

---

## 📦 Include package via cdn
```html
<script src="https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.1.0/toast.min.js"></script>
```

## 📦 Include package via npm
```bash
npm i @tsirosgeorge/toastnotification
``` 

## 💡 Usage instructions
### 🔹 Basic Toast
```javascript
toast('Hello world!');
```

### 🔸 With Options
```javascript
toast('Data saved successfully!', {
  type: 'success',
  position: 'top-left',
  duration: 5000,
  animation: 'slide-right',
  icon: '✅',
  showLoader: true,
  onClick: () => alert('Toast clicked!'),
  onShow: () => console.log('Toast shown'),
  onDismiss: () => console.log('Toast dismissed')
});
```

### ✅ Convenience helpers
```javascript
toast.success('Saved!');
toast.error('Failed!');
```

### ⚠️ Confirm (SweetAlert-like)
- Promise API
```javascript
const ok = await toast.confirm('This will delete the file.', {
  title: 'Are you sure?',
  type: 'warning',
  confirmText: 'Yes, delete',
  cancelText: 'Cancel',
  useOverlay: true,
  closeOnOverlayClick: true,
  showClose: true,
  // optional custom button colors
  confirmButtonBg: '#10b981',
  confirmButtonColor: '#fff',
  cancelButtonBg: '#e5e7eb',
  cancelButtonColor: '#1f2937',
});
if (ok) {
  // proceed
}
```

- Callback API
```javascript
toast('Are you sure?', {
  mode: 'confirm',
  type: 'warning',
  title: 'Confirm action',
  onConfirm: () => console.log('YES'),
  onCancel: () => console.log('NO'),
});
```

### ⏳ Loading → Update
```javascript
const t = toast.loading('Uploading…', { type: 'info' });
// later
t.update('Done!', { type: 'success', duration: 2000 });
```

## 🛠️ Available Options

| Option       | Type       | Default       | Description                                                                                   |
|--------------|------------|---------------|-----------------------------------------------------------------------------------------------|
| `position`   | `string`   | `'top-right'` | Container position. Values: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`, `'top-center'`, `'bottom-center'`. |
| `animation`  | `string`   | `'slide-right'` | Show animation. Examples: `'slide-right'`, `'slide-left'`, `'slide-top'`, `'slide-bottom'`, `'zoom-in'`. Hide uses reverse automatically. |
| `type`       | `string`   | `'info'`      | Type of toast, controlling icon and styling. Possible values: `'info'`, `'success'`, `'error'`, `'warning'`. |
| `duration`   | `number`   | `3000`        | Duration in milliseconds before the toast automatically dismisses.                            |
| `icon`       | `string` or `null` | `null` | Optional custom icon displayed as text (e.g., emoji) before the toast message. If not set, a default GIF icon is used based on the `type`. |
| `showLoader` | `boolean`  | `false`       | Whether to show a loader/progress bar animation on the toast during its visible duration.    |
| `onClick`    | `function` or `null` | `null` | Callback function executed when the toast is clicked.                                        |
| `onShow`     | `function` or `null` | `null` | Callback function executed when the toast appears (after it's added to the DOM and shown).   |
| `onDismiss`  | `function` or `null` | `null` | Callback function executed when the toast is dismissed and removed from the DOM.             |

### 🧩 Confirm-specific options
| Option | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `"confirm" | "swal"` | — | Set to show a confirm dialog with Yes/No buttons. |
| `title` | `string` | `null` | Optional heading shown above the message. |
| `confirmText` | `string` | `"Yes"` | Confirm button label. |
| `cancelText` | `string` | `"No"` | Cancel button label. |
| `useOverlay` | `boolean` | `true` | Dim the background and center the dialog. |
| `closeOnOverlayClick` | `boolean` | `true` | Clicking the overlay cancels. |
| `showClose` | `boolean` | `false` | Show a top-right × button. |
| `confirmButtonBg` | `string` | `null` | Inline background color for confirm button. |
| `confirmButtonColor` | `string` | `null` | Inline text color for confirm button. |
| `cancelButtonBg` | `string` | `null` | Inline background color for cancel button. |
| `cancelButtonColor` | `string` | `null` | Inline text color for cancel button. |

### 🧪 Playground
Open `index.html` to experiment with all options (message, type, position, animation, duration, icon, loader, confirm title/texts, overlay, close, and button colors).


## 📝 License

© 2025 George Tsiros. All rights reserved.

This software is provided for **use only as distributed** by the author.

### ❌ Restrictions
- Modifying or creating derivative works is **not allowed**.
- Redistributing, sublicensing, or reselling the software is **prohibited**.
- Reverse engineering or extracting the source code is **strictly forbidden**.

### ⚠️ Disclaimer
This software is provided "as is", without warranty of any kind. Use at your own risk.

📬 For commercial licensing or inquiries, please contact the author at: tsirosgeorge@pm.me

---

**Note:** This package is marked as `UNLICENSED` in `package.json` to reflect these restrictions.
