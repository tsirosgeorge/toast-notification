# 🔔 ToastNotification

A lightweight, customizable, and dependency-free toast notification system written in vanilla JavaScript.

---

## ⚙️ Minify the `toast.js` File

Use [Terser](https://github.com/terser/terser) to minify your script:

```bash
terser toast.js --compress --mangle --output toast.min.js
```

## 🚀 Publish the package to NPM

```bash
npm login
npm publish
```

## 📦 Include package via cdn
```html
<script src="https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@{LATEST VERSION GOES HERE}/toast.min.js"></script>
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

## 🛠️ Available Options

| Option       | Type       | Default       | Description                                                                                   |
|--------------|------------|---------------|-----------------------------------------------------------------------------------------------|
| `position`   | `string`   | `'top-right'` | Position of the toast container. Possible values: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`. |
| `animation`  | `string`   | `'slide-right'` | Animation effect applied to the toast when it shows and hides. Examples: `'fade'`, `'slide-right'`, `'slide-left'`, `'slide-top'`, `'slide-bottom'`, `'zoom-in'`. The hide animation reverses the show animation automatically. |
| `type`       | `string`   | `'info'`      | Type of toast, controlling icon and styling. Possible values: `'info'`, `'success'`, `'error'`, `'warning'`. |
| `duration`   | `number`   | `3000`        | Duration in milliseconds before the toast automatically dismisses.                            |
| `icon`       | `string` or `null` | `null` | Optional custom icon displayed as text (e.g., emoji) before the toast message. If not set, a default GIF icon is used based on the `type`. |
| `showLoader` | `boolean`  | `false`       | Whether to show a loader/progress bar animation on the toast during its visible duration.    |
| `onClick`    | `function` or `null` | `null` | Callback function executed when the toast is clicked.                                        |
| `onShow`     | `function` or `null` | `null` | Callback function executed when the toast appears (after it's added to the DOM and shown).   |
| `onDismiss`  | `function` or `null` | `null` | Callback function executed when the toast is dismissed and removed from the DOM.             |