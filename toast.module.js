"use strict";

// Dynamically load the external CSS file (same as toast.js)
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.3.0/assets/css/toast.min.css";
document.head.appendChild(link);

// Inject minimal styles for confirm actions and overlay (same as toast.js)
(function injectInlineStyles() {
	const STYLE_ID = "ts-toast-inline-extras";
	if (document.getElementById(STYLE_ID)) return;
	const style = document.createElement("style");
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

// Full implementation copied from toast.js but exposed as ES module
const toast = function (message, options = {}) {
	const {
		position = "top-right",
		animation = "slide-right",
		type = "info",
		duration = 3000,
		icon = null,
		showLoader = false,
		mode = "alert",
		title = null,
		confirmText = "Yes",
		cancelText = "No",
		input = false,
		inputPlaceholder = "",
		inputValue = "",
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
		dismissOnClick = true,
		onClick = null,
		onShow = null,
		onDismiss = null,
	} = options;

	const isConfirm = mode === "confirm" || mode === "swal";

	const resolvedAnimation =
		typeof options.animation === "string" && options.animation.trim()
			? (function mapAnim(a) {
				const m = {
					"slide-top": "ts-toast-slide-top",
					"slide-bottom": "ts-toast-slide-bottom",
					"slide-left": "ts-toast-slide-left",
					"slide-right": "ts-toast-slide-right",
					"zoom-in": "ts-toast-zoom-in",
					"zoom-out": "ts-toast-zoom-out",
					flip: "ts-toast-flip",
				};
				return m[a] || a;
			})(options.animation.trim())
			: isConfirm
			? "ts-toast-zoom-in"
			: position.startsWith("top")
			? "ts-toast-slide-top"
			: position.startsWith("bottom")
			? "ts-toast-slide-bottom"
			: position.endsWith("left")
			? "ts-toast-slide-left"
			: "ts-toast-slide-right";

	// helper: remove with smooth CSS transition and cleanup (used by alerts and confirms)
	const removeWithAnimation = (el, callback) => {
		const anim = el.dataset && el.dataset.anim ? el.dataset.anim : (el.style.animation || "");
		let transform = "";
		if (anim.includes("ts-toast-slide-top")) {
			// Entered from top, exit upwards
			transform = "translateY(-100%)";
		} else if (anim.includes("ts-toast-slide-bottom")) {
			// Entered from bottom, exit upwards
			transform = "translateY(100%)";
		} else if (anim.includes("ts-toast-slide-left")) {
			// Entered from left, exit to right
			transform = "translateX(100%)";
		} else if (anim.includes("ts-toast-slide-right")) {
			// Entered from right, exit to right
			transform = "translateX(100%)";
		}

		el.classList.add("ts-toast-slide-out");
		el.classList.remove("ts-toast-show");
		el.style.animation = "";
		if (transform) {
			el.style.transform = transform;
		}
		el.style.opacity = "0";

		setTimeout(() => {
			el.classList.remove("ts-toast-slide-out");
			if (el.parentNode) el.parentNode.removeChild(el);
			if (typeof callback === "function") callback();
		}, 500);
	};

	const toastElement = document.createElement("div");
	toastElement.className = `ts-toast ts-toast-${type}${isConfirm ? " ts-toast-confirm" : ""}`;
	toastElement.dataset.anim = resolvedAnimation;
	toastElement.style.animation = `${resolvedAnimation} 0.5s ease`;
	if (!isConfirm) {
		toastElement.style.flexDirection = "row-reverse";
		toastElement.style.justifyContent = "flex-end";
	}

	const iconElement = document.createElement("span");
	iconElement.className = "ts-toast-icon";
	iconElement.style.display = "flex";
	if (icon) {
		iconElement.textContent = icon;
	} else {
		const img = document.createElement("img");
		img.src = "";
		img.style.width = "30px";
		img.style.height = "30px";
		img.style.objectFit = "contain";

		const baseUrl =
			"https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.3.0/assets/img/";
		const timestamp = new Date().getTime();

		if (type === "success") {
			img.src = `${baseUrl}success.gif?t=${timestamp}`;
		} else if (type === "error") {
			img.src = `${baseUrl}error.gif?t=${timestamp}`;
		} else if (type === "info") {
			img.src = `${baseUrl}info.gif?t=${timestamp}`;
		} else if (type === "warning") {
			img.src = `${baseUrl}warning.gif?t=${timestamp}`;
		}

		iconElement.appendChild(img);
	}

	const toastBody = document.createElement("div");
	toastBody.className = "ts-toast-body";
	toastBody.innerHTML = message;

	let contentRow = null;
	if (isConfirm) {
		contentRow = document.createElement("div");
		contentRow.className = "ts-toast-content";
		contentRow.appendChild(iconElement);
		if (title) {
			const titleEl = document.createElement("div");
			titleEl.className = "ts-toast-title";
			titleEl.textContent = title;
			contentRow.appendChild(titleEl);
		}
		contentRow.appendChild(toastBody);
		toastElement.appendChild(contentRow);
	} else {
		toastElement.appendChild(toastBody);
	}

	// Input field (for confirm mode with input)
	let inputElement = null;
	if (isConfirm && input) {
		if (input === "textarea") {
			inputElement = document.createElement("textarea");
			inputElement.rows = 3;
		} else {
			inputElement = document.createElement("input");
			inputElement.type = input === "text" || input === "email" || input === "password" || input === "number" ? input : "text";
		}
		inputElement.className = "ts-toast-input";
		inputElement.placeholder = inputPlaceholder;
		inputElement.value = inputValue;
		toastElement.appendChild(inputElement);
	}

	let actionsContainer = null;
	let resultResolver = null;
	if (isConfirm) {
		actionsContainer = document.createElement("div");
		actionsContainer.className = "ts-toast-actions";

		const cancelBtn = document.createElement("button");
		cancelBtn.className = "ts-toast-btn cancel";
		cancelBtn.textContent = cancelText;

		const confirmBtn = document.createElement("button");
		confirmBtn.className = "ts-toast-btn confirm";
		confirmBtn.textContent = confirmText;

		if (cancelButtonBg) cancelBtn.style.background = cancelButtonBg;
		if (cancelButtonColor) cancelBtn.style.color = cancelButtonColor;
		if (confirmButtonBg) confirmBtn.style.background = confirmButtonBg;
		if (confirmButtonColor) confirmBtn.style.color = confirmButtonColor;

		actionsContainer.appendChild(cancelBtn);
		actionsContainer.appendChild(confirmBtn);
		toastElement.appendChild(actionsContainer);

		toastElement.result = new Promise((resolve) => {
			resultResolver = resolve;
		});

		const resolveAndClose = (value) => {
			const result = (value && inputElement !== null) ? inputElement.value : value;
			if (resultResolver) resultResolver(result);
			if (value && typeof onConfirm === "function") onConfirm((inputElement !== null) ? inputElement.value : value, toastElement);
			if (!value && typeof onCancel === "function") onCancel(toastElement);
			if (typeof onResult === "function") onResult(result, toastElement);
			// Use the same slide+fade removal as alerts
			removeWithAnimation(toastElement, () => {
				if (onDismiss && typeof onDismiss === "function") onDismiss(toastElement);
				if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
			});
		};

		cancelBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			resolveAndClose(false);
		});
		confirmBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			resolveAndClose(true);
		});
	}

	let loader = null;
	if (showLoader) {
		loader = document.createElement("div");
		loader.className = "ts-toast-loader";
		toastElement.appendChild(loader);
	}

	let overlay = null;
		if (isConfirm && useOverlay) {
		overlay = document.createElement("div");
		overlay.className = `ts-toast-overlay ${position}`;
		document.body.appendChild(overlay);
		overlay.appendChild(toastElement);
		if (showClose) {
			const closeBtn = document.createElement("button");
			closeBtn.className = "ts-toast-close";
			closeBtn.setAttribute("aria-label", "Close");
			closeBtn.innerHTML = "&times;";
			closeBtn.addEventListener("click", (e) => {
				e.stopPropagation();
					removeWithAnimation(toastElement, () => {
						if (onDismiss && typeof onDismiss === "function") onDismiss(toastElement);
						if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
					});
			});
			toastElement.appendChild(closeBtn);
		}
		if (closeOnOverlayClick) {
			overlay.addEventListener("click", (e) => {
				if (e.target === overlay) {
					if (toastElement.result) {
						if (typeof resultResolver === "function") {
							resultResolver(false);
						}
					}
						removeWithAnimation(toastElement, () => {
							if (onDismiss && typeof onDismiss === "function") onDismiss(toastElement);
							if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
						});
				}
			});
		}
	} else {
		let container = document.querySelector(`.ts-toast-container.${position}`);
		if (!container) {
			container = document.createElement("div");
			container.className = `ts-toast-container ${position}`;
			document.body.appendChild(container);
		}
		container.appendChild(toastElement);
	}

	if (onShow && typeof onShow === "function") {
		onShow(toastElement);
	}

	setTimeout(() => {
		toastElement.classList.add("ts-toast-show");
	}, 100);

	if (showLoader && loader) {
		setTimeout(() => {
			if (toastElement._managedByLoading) return;
			loader.classList.add("done");
			loader.remove();
			if (!toastElement.contains(iconElement)) {
				if (isConfirm && contentRow) contentRow.appendChild(iconElement);
				else toastElement.appendChild(iconElement);
			}
		}, 2000);
	}
	if (!showLoader) {
		if (!isConfirm && !toastElement.contains(iconElement)) {
			toastElement.appendChild(iconElement);
		}
	}

	if (!isConfirm && duration > 0) {
		const autoRemove = setTimeout(() => {
			removeWithAnimation(toastElement, () => {
				if (onDismiss && typeof onDismiss === "function") onDismiss(toastElement);
			});
		}, duration);
		toastElement._autoRemove = autoRemove;
	}

	if (!isConfirm && dismissOnClick) {
		toastElement.addEventListener("click", () => {
			if (toastElement._autoRemove) clearTimeout(toastElement._autoRemove);
			removeWithAnimation(toastElement, () => {
				if (onClick && typeof onClick === "function") onClick(toastElement);
				if (onDismiss && typeof onDismiss === "function") onDismiss(toastElement);
			});
		});
	}

	if (!isConfirm) {
		let touchStartX = 0;
		let touchEndX = 0;

		toastElement.addEventListener("touchstart", (e) => {
			touchStartX = e.changedTouches[0].screenX;
		});

		toastElement.addEventListener("touchend", (e) => {
			touchEndX = e.changedTouches[0].screenX;
			if (Math.abs(touchStartX - touchEndX) > 50) {
				if (toastElement._autoRemove) clearTimeout(toastElement._autoRemove);
				removeWithAnimation(toastElement, () => {
					if (onDismiss && typeof onDismiss === "function") onDismiss(toastElement);
				});
			}
		});
	}

	return toastElement;
};

toast.success = function (message, options) {
	toast(message, { ...options, type: "success" });
};

toast.error = function (message, options) {
	toast(message, { ...options, type: "error" });
};

toast.update = function (toastElement, message, options = {}) {
	const {
		type = null,
		icon = null,
		showLoader = false,
		duration = 3000,
		position = "top-right",
		onClick = null,
		onShow = null,
		onDismiss = null,
	} = options;

	const oldLoader = toastElement.querySelector(".ts-toast-loader");
	const oldIcon = toastElement.querySelector(".ts-toast-icon");
	if (oldLoader) oldLoader.remove();

	if (type) {
		toastElement.className = `ts-toast ts-toast-${type} show ${position}`;
	}
	const toastBody = toastElement.querySelector(".ts-toast-body");
	if (toastBody) {
		toastBody.innerHTML = message;
	}

	if (oldIcon) {
		oldIcon.remove();
	}

	const iconElement = document.createElement("span");
	iconElement.className = "ts-toast-icon";
	iconElement.style.display = "flex";

	if (icon) {
		iconElement.textContent = icon;
	} else {
		const img = document.createElement("img");
		img.style.width = "30px";
		img.style.height = "30px";
		img.style.objectFit = "contain";

		if (type === "success") {
			img.src =
				"https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/img/success.gif";
		} else if (type === "error") {
			img.src =
				"https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/img/error.gif";
		} else if (type === "info") {
			img.src =
				"https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/img/info.gif";
		} else if (type === "warning") {
			img.src =
				"https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@5.2.0/assets/img/warning.gif";
		}

		iconElement.appendChild(img);
	}

	toastElement.appendChild(iconElement);

	if (showLoader) {
		const loader = document.createElement("div");
		loader.className = "ts-toast-loader";
		toastElement.appendChild(loader);
		setTimeout(() => {
			loader.classList.add("done");
		}, 2000);
	}

	if (toastElement._autoRemove) {
		clearTimeout(toastElement._autoRemove);
	}

	const autoRemove = setTimeout(() => {
		const removeWithAnimation = (el, cb) => {
			el.classList.add("ts-toast-slide-out");
			el.classList.remove("ts-toast-show");
			el.style.animation = "";
			setTimeout(() => {
				el.classList.remove("ts-toast-slide-out");
				if (el.parentNode) el.parentNode.removeChild(el);
				if (typeof cb === "function") cb();
			}, 500);
		};

		removeWithAnimation(toastElement, () => {
			if (onDismiss && typeof onDismiss === "function") onDismiss(toastElement);
		});
	}, duration);

	toastElement._autoRemove = autoRemove;
};

toast.loading = function (message, options = {}) {
	const toastElement = toast(message, {
		...options,
		type: options.type || "info",
		duration: 0,
		showLoader: true,
		icon: null,
	});

	requestAnimationFrame(() => {
		toastElement.classList.add("ts-toast-show");
	});

	const loader = toastElement.querySelector(".ts-toast-loader");
	let iconElement = toastElement.querySelector(".ts-toast-icon");

	if (!iconElement) {
		iconElement = document.createElement("span");
		iconElement.className = "ts-toast-icon";
		iconElement.style.display = "flex";
		toastElement.appendChild(iconElement);
	}

	toastElement._managedByLoading = true;

	if (loader) {
		setTimeout(() => {
			if (!toastElement._managedByLoading) loader.classList.add("done");
		}, 2000);
	}

	return {
		update: (newMessage, newOptions = {}) => {
			toastElement._managedByLoading = false;
			toast.update(toastElement, newMessage, {
				...newOptions,
				showLoader: false,
			});
		},
		close: () => {
			if (toastElement._autoRemove) clearTimeout(toastElement._autoRemove);
			toastElement.classList.add("ts-toast-slide-out");
			toastElement.classList.remove("ts-toast-show");
			toastElement.style.animation = "";
			setTimeout(() => {
				toastElement.classList.remove("ts-toast-slide-out");
				if (toastElement.parentNode) toastElement.parentNode.removeChild(toastElement);
			}, 500);
		},
	};
};

toast.confirm = function (message, options = {}) {
	return new Promise((resolve) => {
		const el = toast(message, {
			...options,
			mode: "confirm",
			duration: 0,
			dismissOnClick: false,
			onResult: (val) => resolve(val),
		});
		void el;
	});
};

// ES module export
export default toast;
export { toast };
