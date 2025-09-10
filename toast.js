(function () {
    "use strict";

    // Dynamically load the external CSS file
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/css/toast.min.css";// Pinned to current release
    document.head.appendChild(link);

    // Inject minimal styles for confirm actions and overlay (kept tiny to avoid breaking existing CSS)
    (function injectInlineStyles() {
        const STYLE_ID = 'ts-toast-inline-extras';
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            /* Ensure center positions exist even if external CSS lacks them */
            .ts-toast-container.top-center { top: 1rem; left: 50%; transform: translateX(-50%); align-items: center; }
            .ts-toast-container.bottom-center { bottom: 1rem; left: 50%; transform: translateX(-50%); align-items: center; }
            .ts-toast-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483646; }
            .ts-toast.ts-toast-confirm { max-width: min(92vw, 440px); width: max(320px, 60%); flex-direction: column; gap: 12px; padding: 16px 20px; background: var(--toast-bg, #fff); color: var(--toast-color, #000); border: 1px solid var(--toast-border, #e5e7eb); border-radius: 12px; box-shadow: var(--toast-shadow, 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)); text-align: center; }
            .ts-toast.ts-toast-confirm .ts-toast-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
            .ts-toast-actions { display: flex; gap: 10px; justify-content: center; margin-top: 12px; }
            .ts-toast-btn { appearance: none; border: 0; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; }
            .ts-toast-btn.cancel { background: #e9ecef; color: #1f2937; }
            .ts-toast-btn.confirm { background: #3b82f6; color: #fff; }
            .ts-toast.ts-toast-error .ts-toast-btn.confirm,
            .ts-toast.ts-toast-warning .ts-toast-btn.confirm { background: #ef4444; color: #fff; }
            .ts-toast.ts-toast-confirm .ts-toast-title { font-weight: 700; font-size: 1.05rem; margin-top: 4px; }
            .ts-toast.ts-toast-confirm .ts-toast-close { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 999px; border: 0; background: transparent; color: #6b7280; font-size: 20px; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
            .ts-toast.ts-toast-confirm .ts-toast-close:hover { background: rgba(0,0,0,0.06); }
            .ts-toast.ts-toast-confirm .ts-toast-icon { width: 64px; height: 64px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; }
            .ts-toast.ts-toast-confirm .ts-toast-icon img { width: 36px; height: 36px; }
            .ts-toast.ts-toast-confirm.ts-toast-success .ts-toast-icon { background: #dcfce7; }
            .ts-toast.ts-toast-confirm.ts-toast-info .ts-toast-icon { background: #dbeafe; }
            .ts-toast.ts-toast-confirm.ts-toast-warning .ts-toast-icon { background: #fef3c7; }
            .ts-toast.ts-toast-confirm.ts-toast-error .ts-toast-icon { background: #fee2e2; }
        `;
        document.head.appendChild(style);
    })();

    const toast = function (message, options = {}) {
        const {
            position = 'top-right',
            animation = 'slide-right', // Default fallback animation
            type = 'info',
            duration = 3000,
            icon = null,
            showLoader = false,
            // behavior/mode: 'alert' (default) or 'confirm'/'swal'
            mode = 'alert',
            // confirm options (used when mode is 'confirm' or 'swal')
            title = null,
            confirmText = 'Yes',
            cancelText = 'No',
            // confirm button color customization (optional)
            confirmButtonBg = null,
            confirmButtonColor = null,
            cancelButtonBg = null,
            cancelButtonColor = null,
            onConfirm = null,
            onCancel = null,
            onResult = null,
            useOverlay = true,
            closeOnOverlayClick = true,
            showClose = false,
            // interactions
            dismissOnClick = true, // ignored if confirm-mode
            onClick = null,      // Custom onClick event listener
            onShow = null,       // Custom onShow event listener
            onDismiss = null     // Custom onDismiss event listener
        } = options;

        const isConfirm = (mode === 'confirm' || mode === 'swal');

        // Pick an animation intelligently when one wasn't explicitly provided
        const resolvedAnimation = (typeof options.animation === 'string' && options.animation.trim())
            ? (function mapAnim(a){
                const m = {
                    'slide-top':'ts-toast-slide-top',
                    'slide-bottom':'ts-toast-slide-bottom',
                    'slide-left':'ts-toast-slide-left',
                    'slide-right':'ts-toast-slide-right',
                    'zoom-in':'ts-toast-zoom-in',
                    'zoom-out':'ts-toast-zoom-out',
                    'flip':'ts-toast-flip'
                };
                return m[a] || a;
            })(options.animation.trim())
            : (isConfirm ? 'ts-toast-zoom-in' : (position.startsWith('top') ? 'ts-toast-slide-top'
                : position.startsWith('bottom') ? 'ts-toast-slide-bottom'
                : position.endsWith('left') ? 'ts-toast-slide-left'
                : 'ts-toast-slide-right'));

        // helper: remove with reverse animation and cleanup
        const removeWithAnimation = (el, callback) => {
            // Get the current animation applied to the toast
            const currentAnimation = el.style.animation || '';

            // Determine the reverse animation based on the current animation
            let reverseAnimation = '';
            if (currentAnimation.includes('ts-toast-slide-top')) {
                reverseAnimation = 'ts-toast-slide-top-reverse';
            } else if (currentAnimation.includes('ts-toast-slide-bottom')) {
                reverseAnimation = 'ts-toast-slide-bottom-reverse';
            } else if (currentAnimation.includes('ts-toast-slide-left')) {
                reverseAnimation = 'ts-toast-slide-left-reverse';
            } else if (currentAnimation.includes('ts-toast-slide-right')) {
                reverseAnimation = 'ts-toast-slide-right-reverse';
            } else if (currentAnimation.includes('ts-toast-zoom-in')) {
                reverseAnimation = 'ts-toast-zoom-out';
            }

            // Apply the reverse animation dynamically
            el.classList.add('ts-toast-slide-out');
            el.style.animation = `${reverseAnimation} 0.5s ease`;

            // Wait for the reverse animation to finish before removing the toast
            setTimeout(() => {
                el.classList.remove('ts-toast-show', 'ts-toast-slide-out');
                el.style.animation = '';
                if (el.parentNode) el.parentNode.removeChild(el);
                if (typeof callback === 'function') callback();
            }, 500);
        };

    const toastElement = document.createElement('div');
        toastElement.className = `ts-toast ts-toast-${type}${isConfirm ? ' ts-toast-confirm' : ''}`;
    toastElement.style.animation = `${resolvedAnimation} 0.5s ease`;
        // In confirm mode, we stack content vertically; in alert mode keep original layout
        if (!isConfirm) {
            toastElement.style.flexDirection = 'row-reverse';
            toastElement.style.justifyContent = 'flex-end';
        }

        // Create Icon Element
    const iconElement = document.createElement('span');
    iconElement.className = 'ts-toast-icon';
    iconElement.style.display = 'flex';
        if (icon) {
            iconElement.textContent = icon;
        } else {
            const img = document.createElement('img');
            img.src = '';
            img.style.width = '30px';
            img.style.height = '30px';
            img.style.objectFit = 'contain';

            const baseUrl = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/img/';
            const timestamp = new Date().getTime(); // 🔄 force refresh

            if (type === 'success') {
                img.src = `${baseUrl}success.gif?t=${timestamp}`;
            } else if (type === 'error') {
                img.src = `${baseUrl}error.gif?t=${timestamp}`;
            } else if (type === 'info') {
                img.src = `${baseUrl}info.gif?t=${timestamp}`;
            } else if (type === 'warning') {
                img.src = `${baseUrl}warning.gif?t=${timestamp}`;
            }

            iconElement.appendChild(img);
        }

        // Create Body
        const toastBody = document.createElement('div');
        toastBody.className = 'ts-toast-body';
        toastBody.innerHTML = message; // Allow HTML content in message

        // Content row for confirm (icon + text side-by-side)
        let contentRow = null;
        if (isConfirm) {
            contentRow = document.createElement('div');
            contentRow.className = 'ts-toast-content';
            contentRow.appendChild(iconElement);
            if (title) {
                const titleEl = document.createElement('div');
                titleEl.className = 'ts-toast-title';
                titleEl.textContent = title;
                contentRow.appendChild(titleEl);
            }
            contentRow.appendChild(toastBody);
            toastElement.appendChild(contentRow);
        } else {
            toastElement.appendChild(toastBody);
        }

        // Actions (for confirm mode)
        let actionsContainer = null;
        let resultResolver = null;
        if (isConfirm) {
            actionsContainer = document.createElement('div');
            actionsContainer.className = 'ts-toast-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'ts-toast-btn cancel';
            cancelBtn.textContent = cancelText;

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'ts-toast-btn confirm';
            confirmBtn.textContent = confirmText;

            // Apply custom button colors if provided (inline style overrides theme defaults)
            if (cancelButtonBg) cancelBtn.style.background = cancelButtonBg;
            if (cancelButtonColor) cancelBtn.style.color = cancelButtonColor;
            if (confirmButtonBg) confirmBtn.style.background = confirmButtonBg;
            if (confirmButtonColor) confirmBtn.style.color = confirmButtonColor;

            actionsContainer.appendChild(cancelBtn);
            actionsContainer.appendChild(confirmBtn);
            toastElement.appendChild(actionsContainer);

            // Create a Promise that resolves on user choice; expose via property
            toastElement.result = new Promise((resolve) => { resultResolver = resolve; });

            const resolveAndClose = (value) => {
                if (resultResolver) resultResolver(value);
                if (value && typeof onConfirm === 'function') onConfirm(toastElement);
                if (!value && typeof onCancel === 'function') onCancel(toastElement);
                if (typeof onResult === 'function') onResult(value, toastElement);
                removeWithAnimation(toastElement, () => {
                    if (onDismiss && typeof onDismiss === 'function') onDismiss(toastElement);
                    // Remove overlay if present
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                });
            };

            cancelBtn.addEventListener('click', (e) => { e.stopPropagation(); resolveAndClose(false); });
            confirmBtn.addEventListener('click', (e) => { e.stopPropagation(); resolveAndClose(true); });
        }

        // Loader Element
        let loader = null;
        if (showLoader) {
            loader = document.createElement('div');
            loader.className = 'ts-toast-loader';
            toastElement.appendChild(loader);
        }

        // Container/Overlay
        let overlay = null;
        if (isConfirm && useOverlay) {
            overlay = document.createElement('div');
            overlay.className = 'ts-toast-overlay';
            document.body.appendChild(overlay);
            overlay.appendChild(toastElement);
            if (showClose) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'ts-toast-close';
                closeBtn.setAttribute('aria-label', 'Close');
                closeBtn.innerHTML = '&times;';
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeWithAnimation(toastElement, () => {
                        if (onDismiss && typeof onDismiss === 'function') onDismiss(toastElement);
                        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    });
                });
                toastElement.appendChild(closeBtn);
            }
            if (closeOnOverlayClick) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        // Overlay background click -> cancel
                        if (toastElement.result) {
                            // let the confirm logic close and cleanup
                            if (typeof resultResolver === 'function') {
                                resultResolver(false);
                            }
                        }
                        removeWithAnimation(toastElement, () => {
                            if (onDismiss && typeof onDismiss === 'function') onDismiss(toastElement);
                            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                        });
                    }
                });
            }
        } else {
            // Standard positioned container
            let container = document.querySelector(`.ts-toast-container.${position}`);
            if (!container) {
                container = document.createElement('div');
                container.className = `ts-toast-container ${position}`;
                document.body.appendChild(container);
            }
            container.appendChild(toastElement);
        }

        // Trigger the onShow event if provided
        if (onShow && typeof onShow === 'function') {
            onShow(toastElement);
        }

        // Show Toast with animation
        setTimeout(() => {
            toastElement.classList.add('ts-toast-show');
        }, 100);

        // Handle Loader and Icon
        if (showLoader && loader) {
            setTimeout(() => {
                // Skip auto-complete if controlled by toast.loading()
                if (toastElement._managedByLoading) return;
                loader.classList.add('done');
                loader.remove();
                if (!toastElement.contains(iconElement)) {
                    if (isConfirm && contentRow) contentRow.appendChild(iconElement);
                    else toastElement.appendChild(iconElement); // Add icon only if not present
                }
            }, 2000); // Simulate a loading period of 2 seconds
        }
        if (!showLoader) {
            // For confirm, icon already added above inside contentRow; avoid moving it
            if (!isConfirm && !toastElement.contains(iconElement)) {
                toastElement.appendChild(iconElement);
            }
        }

        // Auto remove after the duration (skip for confirm mode or when duration <= 0)
        if (!isConfirm && duration > 0) {
            const autoRemove = setTimeout(() => {
                removeWithAnimation(toastElement, () => {
                    if (onDismiss && typeof onDismiss === 'function') onDismiss(toastElement);
                });
            }, duration);
            toastElement._autoRemove = autoRemove;
        }

        // Add event listener for closing the toast when clicked (disabled in confirm mode)
        if (!isConfirm && dismissOnClick) {
            toastElement.addEventListener('click', () => {
                if (toastElement._autoRemove) clearTimeout(toastElement._autoRemove); // Clear the auto-remove timeout
                removeWithAnimation(toastElement, () => {
                    if (onClick && typeof onClick === 'function') onClick(toastElement);
                    if (onDismiss && typeof onDismiss === 'function') onDismiss(toastElement);
                });
            });
        }

        // Add swipe event listeners for mobile dismissal
        if (!isConfirm) {
            let touchStartX = 0;
            let touchEndX = 0;

            toastElement.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });

            toastElement.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                if (Math.abs(touchStartX - touchEndX) > 50) { // Swipe distance threshold
                    if (toastElement._autoRemove) clearTimeout(toastElement._autoRemove);
                    removeWithAnimation(toastElement, () => {
                        if (onDismiss && typeof onDismiss === 'function') onDismiss(toastElement);
                    });
                }
            });
        }

        return toastElement;
    };

    toast.success = function (message, options) {
        toast(message, { ...options, type: 'success' });
    };

    toast.error = function (message, options) {
        toast(message, { ...options, type: 'error' });
    };

    // Update toast function to handle removal with animation
    toast.update = function (toastElement, message, options = {}) {
        const {
            type = null,
            icon = null,
            showLoader = false,
            duration = 3000, // Default duration (in ms)
            position = 'top-right', // Default position,
            onClick = null,      // Custom onClick event listener
            onShow = null,       // Custom onShow event listener
            onDismiss = null     // Custom onDismiss event listener
        } = options;

        // Remove old loader (if any)
        const oldLoader = toastElement.querySelector('.ts-toast-loader');
        const oldIcon = toastElement.querySelector('.ts-toast-icon');
        if (oldLoader) oldLoader.remove();

        // Update toast class and message
        if (type) {
            // keep ts- prefix consistent
            toastElement.className = `ts-toast ts-toast-${type} show ${position}`;
        }
        const toastBody = toastElement.querySelector('.ts-toast-body');
        if (toastBody) {
            toastBody.innerHTML = message;
        }

        // Handle Icon update only if it's new or hasn't been set yet
        if (oldIcon) {
            oldIcon.remove(); // Remove the old icon first
        }

    const iconElement = document.createElement('span');
    iconElement.className = 'ts-toast-icon';
    iconElement.style.display = 'flex';

        if (icon) {
            iconElement.textContent = icon;
        } else {
            const img = document.createElement('img');
            img.style.width = '30px';
            img.style.height = '30px';
            img.style.objectFit = 'contain';

            if (type === 'success') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/img/success.gif';
            } else if (type === 'error') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/img/error.gif';
            } else if (type === 'info') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/img/info.gif';
            } else if (type === 'warning') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/img/warning.gif';
            }

            iconElement.appendChild(img);
        }

        // Append the new icon immediately
        toastElement.appendChild(iconElement);

        // Handle loader if requested
        if (showLoader) {
            const loader = document.createElement('div');
            loader.className = 'ts-toast-loader';
            toastElement.appendChild(loader);
            setTimeout(() => {
                loader.classList.add('done');
            }, 2000);  // Simulate loader completion after 2 seconds
        }

        // Clear previous auto-remove timer if needed
        if (toastElement._autoRemove) {
            clearTimeout(toastElement._autoRemove);
        }

        // Set the auto-remove timer again to ensure toast disappears after the duration
        const autoRemove = setTimeout(() => {
            // Use the same helper removal used above
            // Re-create the helper here in case update() is used alone
            const removeWithAnimation = (el, cb) => {
                const currentAnimation = el.style.animation || '';
                let reverseAnimation = '';
                if (currentAnimation.includes('slide-top')) reverseAnimation = 'slide-top-reverse';
                else if (currentAnimation.includes('slide-bottom')) reverseAnimation = 'slide-bottom-reverse';
                else if (currentAnimation.includes('slide-left')) reverseAnimation = 'slide-left-reverse';
                else if (currentAnimation.includes('slide-right')) reverseAnimation = 'slide-right-reverse';
                else if (currentAnimation.includes('zoom-in')) reverseAnimation = 'zoom-out';
                el.classList.add('ts-toast-slide-out');
                el.style.animation = `${reverseAnimation} 0.5s ease`;
                setTimeout(() => {
                    el.classList.remove('ts-toast-show', 'ts-toast-slide-out');
                    el.style.animation = '';
                    if (el.parentNode) el.parentNode.removeChild(el);
                    if (typeof cb === 'function') cb();
                }, 500);
            };

            removeWithAnimation(toastElement, () => {
                if (onDismiss && typeof onDismiss === 'function') onDismiss(toastElement);
            });
        }, duration);

        toastElement._autoRemove = autoRemove; // Re-set the auto-remove timer
    };

    toast.loading = function (message, options = {}) {
        const toastElement = toast(message, {
            ...options,
            type: options.type || 'info', // Default type is 'info'
            duration: 0, // Sticky until manually updated/closed
            showLoader: true, // Always show loader during loading
            icon: null
        });

        // Force reflow and add animation after DOM insert
        requestAnimationFrame(() => {
            toastElement.classList.add('ts-toast-show');
        });

        const loader = toastElement.querySelector('.ts-toast-loader');
        let iconElement = toastElement.querySelector('.ts-toast-icon');

        // Ensure the iconElement is created and appended if it doesn't exist
        if (!iconElement) {
            iconElement = document.createElement('span');
            iconElement.className = 'ts-toast-icon';
            iconElement.style.display = 'flex';
            toastElement.appendChild(iconElement);
        }

        // mark as managed by loading flow to avoid internal auto-complete
        toastElement._managedByLoading = true;

        // Ensure loader is handled properly
        if (loader) {
            setTimeout(() => {
                // Keep spinning until update() decides otherwise
                if (!toastElement._managedByLoading) loader.classList.add('done');
            }, 2000); // Simulate a loading period of 2 seconds
        }

        return {
            update: (newMessage, newOptions = {}) => {
                // Let update manage completion: stop managing/finish loader
                toastElement._managedByLoading = false;
                toast.update(toastElement, newMessage, {
                    ...newOptions,
                    showLoader: false // Disable loader when updating the message
                });
            },
            close: () => {
                if (toastElement._autoRemove) clearTimeout(toastElement._autoRemove);
                const currentAnimation = toastElement.style.animation || '';
                let reverseAnimation = '';
                if (currentAnimation.includes('slide-top')) reverseAnimation = 'slide-top-reverse';
                else if (currentAnimation.includes('slide-bottom')) reverseAnimation = 'slide-bottom-reverse';
                else if (currentAnimation.includes('slide-left')) reverseAnimation = 'slide-left-reverse';
                else if (currentAnimation.includes('slide-right')) reverseAnimation = 'slide-right-reverse';
                else if (currentAnimation.includes('zoom-in')) reverseAnimation = 'zoom-out';
                toastElement.classList.add('ts-toast-slide-out');
                toastElement.style.animation = `${reverseAnimation} 0.5s ease`;
                setTimeout(() => {
                    toastElement.classList.remove('ts-toast-show', 'ts-toast-slide-out');
                    toastElement.style.animation = '';
                    if (toastElement.parentNode) toastElement.parentNode.removeChild(toastElement);
                }, 500);
            }
        };
    };

    // Convenience API: swal-like confirm dialog
    // Usage: toast.confirm('Are you sure?', { type: 'warning', confirmText: 'Yes', cancelText: 'No' }).then(ok => {...})
    toast.confirm = function (message, options = {}) {
        return new Promise((resolve) => {
            const el = toast(message, {
                ...options,
                mode: 'confirm',
                duration: 0, // prevent auto-dismiss
                dismissOnClick: false,
                onResult: (val) => resolve(!!val)
            });
            // If consumer needs the element, it is returned by toast() but we ignore here.
            // They can still call toast(...) with mode: 'confirm' to get the element and read el.result
            void el; // no-op
        });
    };

    // Expose globally
    window.toast = toast;
})();