(function () {
    "use strict";

    // Dynamically load the external CSS file
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@latest/assets/css/toast.min.css";// Update path as needed
    document.head.appendChild(link);

    const toast = function (message, options = {}) {
        const {
            position = 'top-right',
            animation = 'slide-right', // Default animation is fade
            type = 'info',
            duration = 3000,
            icon = null,
            showLoader = false,
            onClick = null,      // Custom onClick event listener
            onShow = null,       // Custom onShow event listener
            onDismiss = null     // Custom onDismiss event listener
        } = options;

        const toastElement = document.createElement('div');
        toastElement.className = `ts-toast ts-toast-${type}`;
        toastElement.style.animation = `${animation} 0.5s ease`; // Default fade animation
        toastElement.style.flexDirection = 'row-reverse';
        toastElement.style.justifyContent = 'flex-end';

        // Create Icon Element
        const iconElement = document.createElement('span');
        iconElement.className = 'ts-toast-icon';

        if (icon) {
            iconElement.textContent = icon;
        } else {
            const img = document.createElement('img');
            img.style.width = '30px';
            img.style.height = '30px';
            img.style.objectFit = 'contain';

            if (type === 'success') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@latest/assets/img/success.gif';
            } else if (type === 'error') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@latest/assets/img/error.gif';
            } else if (type === 'info') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@latest/assets/img/info.gif';
            } else if (type === 'warning') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@latest/assets/img/warning.gif';
            }

            iconElement.appendChild(img);
        }

        // Create Body
        const toastBody = document.createElement('div');
        toastBody.className = 'ts-toast-body';
        toastBody.innerHTML = message; // Allow HTML content in message
        toastElement.appendChild(toastBody);

        // Loader Element
        let loader = null;
        if (showLoader) {
            loader = document.createElement('div');
            loader.className = 'ts-toast-loader';
            toastElement.appendChild(loader);
        }

        // Container
        let container = document.querySelector(`.ts-toast-container.${position}`);
        if (!container) {
            container = document.createElement('div');
            container.className = `ts-toast-container ${position}`;
            document.body.appendChild(container);
        }

        container.appendChild(toastElement);

        // Trigger the onShow event if provided
        if (onShow && typeof onShow === 'function') {
            onShow(toastElement);
        }

        // Show Toast with animation
        setTimeout(() => {
            toastElement.classList.add('show');
        }, 100);

        // Handle Loader and Icon
        if (showLoader && loader) {
            setTimeout(() => {
                loader.classList.add('done');
                loader.remove();
                if (!toastElement.querySelector('.ts-toast-icon img')) {
                    toastElement.appendChild(iconElement); // Add icon only if not present
                }
            }, 2000); // Simulate a loading period of 2 seconds
        }
        if (!showLoader) {
            toastElement.appendChild(iconElement);
        }

        // Auto remove after the duration
        const autoRemove = setTimeout(() => {
            // Get the current animation applied to the toast
            const currentAnimation = toastElement.style.animation || '';

            // Determine the reverse animation based on the current animation
            let reverseAnimation = '';
            if (currentAnimation.includes('slide-top')) {
                reverseAnimation = 'slide-top-reverse';
            } else if (currentAnimation.includes('slide-bottom')) {
                reverseAnimation = 'slide-bottom-reverse';
            } else if (currentAnimation.includes('slide-left')) {
                reverseAnimation = 'slide-left-reverse';
            } else if (currentAnimation.includes('slide-right')) {
                reverseAnimation = 'slide-right-reverse';
            } else if (currentAnimation.includes('zoom-in')) {
                reverseAnimation = 'zoom-out'; // You could define a zoom-out animation if needed
            }

            // Apply the reverse animation dynamically
            toastElement.classList.add('slide-out');
            toastElement.style.animation = `${reverseAnimation} 0.5s ease`; // Dynamically apply the reverse animation

            // Wait for the reverse animation to finish before removing the toast
            setTimeout(() => {
                toastElement.classList.remove('show', 'slide-out');
                toastElement.style.animation = ''; // Reset the animation property
                if (toastElement.parentNode) toastElement.parentNode.removeChild(toastElement);
                if (onDismiss && typeof onDismiss === 'function') {
                    onDismiss(toastElement); // Trigger the onDismiss event if provided
                }
            }, 500); // Match the duration of the reverse animation
        }, duration);

        toastElement._autoRemove = autoRemove;

        // Add event listener for closing the toast when clicked
        toastElement.addEventListener('click', () => {
            clearTimeout(toastElement._autoRemove); // Clear the auto-remove timeout
            toastElement.classList.remove('show');
            setTimeout(() => {
                if (toastElement.parentNode) toastElement.parentNode.removeChild(toastElement);
            }, 500); // Match the duration of the closing animation

            if (onClick && typeof onClick === 'function') {
                onClick(toastElement); // Trigger the onClick event if provided
            }
        });

        // Add swipe event listeners for mobile dismissal
        let touchStartX = 0;
        let touchEndX = 0;

        toastElement.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        toastElement.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (Math.abs(touchStartX - touchEndX) > 50) { // Swipe distance threshold
                clearTimeout(toastElement._autoRemove); // Clear the auto-remove timeout
                toastElement.classList.remove('show');
                setTimeout(() => {
                    if (toastElement.parentNode) toastElement.parentNode.removeChild(toastElement);
                }, 500); // Match the duration of the closing animation

                if (onDismiss && typeof onDismiss === 'function') {
                    onDismiss(toastElement); // Trigger the onDismiss event if provided
                }
            }
        });

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
        toastElement.className = `toast toast-${type} show ${position}`;
        const toastBody = toastElement.querySelector('.ts-toast-body');
        if (toastBody) {
            toastBody.innerHTML = message;
        }

        // Handle Icon update only if it's new or hasn't been set yet
        if (oldIcon) {
            oldIcon.remove(); // Remove the old icon first
        }

        const iconElement = document.createElement('span');
        iconElement.className = 'toast-icon';

        if (icon) {
            iconElement.textContent = icon;
        } else {
            const img = document.createElement('img');
            img.style.width = '30px';
            img.style.height = '30px';
            img.style.objectFit = 'contain';

            if (type === 'success') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@latest/assets/img/success.gif';
            } else if (type === 'error') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@latest/assets/img/error.gif';
            } else if (type === 'info') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@latest/assets/img/info.gif';
            } else if (type === 'warning') {
                img.src = 'https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@latest/assets/img/warning.gif';
            }

            iconElement.appendChild(img);
        }

        // Append the new icon immediately
        toastElement.appendChild(iconElement);

        // Handle loader if requested
        if (showLoader) {
            const loader = document.createElement('div');
            loader.className = 'toast-loader';
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
            // Get the current animation applied to the toast
            const currentAnimation = toastElement.style.animation || '';

            // Determine the reverse animation based on the current animation
            let reverseAnimation = '';
            if (currentAnimation.includes('slide-top')) {
                reverseAnimation = 'slide-top-reverse';
            } else if (currentAnimation.includes('slide-bottom')) {
                reverseAnimation = 'slide-bottom-reverse';
            } else if (currentAnimation.includes('slide-left')) {
                reverseAnimation = 'slide-left-reverse';
            } else if (currentAnimation.includes('slide-right')) {
                reverseAnimation = 'slide-right-reverse';
            } else if (currentAnimation.includes('zoom-in')) {
                reverseAnimation = 'zoom-out'; // You could define a zoom-out animation if needed
            }

            // Apply the reverse animation dynamically
            toastElement.classList.add('slide-out');
            toastElement.style.animation = `${reverseAnimation} 0.5s ease`; // Dynamically apply the reverse animation

            // Wait for the reverse animation to finish before removing the toast
            setTimeout(() => {
                toastElement.classList.remove('show', 'slide-out');
                toastElement.style.animation = ''; // Reset the animation property
                if (toastElement.parentNode) toastElement.parentNode.removeChild(toastElement);
                if (onDismiss && typeof onDismiss === 'function') {
                    onDismiss(toastElement); // Trigger the onDismiss event if provided
                }
            }, 500); // Match the duration of the reverse animation
        }, duration);

        toastElement._autoRemove = autoRemove; // Re-set the auto-remove timer
    };

    toast.loading = function (message, options = {}) {
        const toastElement = toast(message, {
            ...options,
            type: options.type || 'info', // Default type is 'info'
            duration: 1000, // Long duration for manual closing
            showLoader: true, // Always show loader during loading
            icon: null
        });

        // Force reflow and add animation after DOM insert
        requestAnimationFrame(() => {
            toastElement.classList.add('show');
        });

        const loader = toastElement.querySelector('.ts-toast-loader');
        let iconElement = toastElement.querySelector('.ts-toast-icon');

        // Ensure the iconElement is created and appended if it doesn't exist
        if (!iconElement) {
            iconElement = document.createElement('span');
            iconElement.className = 'ts-toast-icon';
            toastElement.appendChild(iconElement);
        }

        // Ensure loader is handled properly
        if (loader) {
            setTimeout(() => {
                loader.classList.add('done');
            }, 2000); // Simulate a loading period of 2 seconds
        }

        return {
            update: (newMessage, newOptions = {}) => {
                toast.update(toastElement, newMessage, {
                    ...newOptions,
                    showLoader: false // Disable loader when updating the message
                });
            },
            close: () => {
                toastElement.classList.remove('show');
                setTimeout(() => {
                    if (toastElement.parentNode) toastElement.parentNode.removeChild(toastElement);
                }, 500);
            }
        };
    };

    // Expose globally
    window.toast = toast;
})();