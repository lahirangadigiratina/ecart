function normalizeDigits(value) {
  return value.replace(/\D/g, "");
}

function formatDisplay(digits) {
  let d = digits.slice(0, 10);
  if (d.startsWith("0")) {
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  d = d.slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

function formatPhoneInternational(digits) {
  const national = formatDisplay(digits.replace(/^0/, ""));
  return `+61 ${national}`.trim();
}

function isValidAuMobile(digits) {
  const withLeadingZero = digits.startsWith("0") ? digits : `0${digits}`;
  return /^04\d{8}$/.test(withLeadingZero);
}

const input = document.getElementById("mobile");
const hint = document.getElementById("mobile-hint");
const mobileForm = document.getElementById("mobile-form");
const codeForm = document.getElementById("code-form");
const detailsForm = document.getElementById("details-form");
const phoneWrap = document.querySelector("#mobile-form .phone-input");
const detailsPhoneWrap = document.getElementById("details-phone-wrap");
const detailsPhoneInput = document.getElementById("details-phone");
const stepMobile = document.getElementById("step-mobile");
const stepCode = document.getElementById("step-code");
const stepDetails = document.getElementById("step-details");
const stepConnect = document.getElementById("step-connect");
const stepDropoff = document.getElementById("step-dropoff");
const flowCard = document.querySelector(".flow-card");
const flowSteps = [stepMobile, stepCode, stepDetails, stepConnect];
const connectForm = document.getElementById("connect-form");
const dropoffToggle = document.getElementById("dropoff-toggle");
const dropoffLocations = document.getElementById("dropoff-locations");
const dropoffSave = document.getElementById("dropoff-save");
const warehouseChange = document.getElementById("warehouse-change");
const dropoffSettingsModal = document.getElementById("dropoff-settings-modal");
const dropoffSettingsClose = document.getElementById("dropoff-settings-close");
const dropoffSettingsSave = document.getElementById("dropoff-settings-save");
const dropoffSettingsCancel = document.getElementById("dropoff-settings-cancel");
const dropoffModalToggle = document.getElementById("dropoff-modal-toggle");
const dropoffModalLocations = document.getElementById("dropoff-modal-locations");
const modalDialog = dropoffSettingsModal?.querySelector(".modal-dialog");
const ordersView = document.getElementById("orders-view");
const ordersTableBody = document.getElementById("orders-table-body");
const ordersDropoffName = document.getElementById("orders-dropoff-name");
const ordersDropoffSettings = document.getElementById("orders-dropoff-settings");
const restartOnboardingBtn = document.getElementById("restart-onboarding");
const connectBack = document.getElementById("connect-back");
const detailsBack = document.getElementById("details-back");
const codeSentTo = document.querySelector("#code-sent-to .subheading__phone");
const otpInputs = [...document.querySelectorAll(".otp__digit")];
const useDifferentNumber = document.getElementById("use-different-number");
const resendCode = document.getElementById("resend-code");
const progressBar = document.getElementById("progress");
const progressSteps = [...document.querySelectorAll(".progress__step")];
const defaultHint = hint.textContent;
const defaultHintColor = getComputedStyle(hint).color;

const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");
const emailInput = document.getElementById("email");

let savedMobileDigits = "";

const DROPOFF_LOCATION_LABELS = {
  "bp-clayton": "BP Clayton",
  "7eleven-clayton": "7-Eleven Clayton Station",
  "oakleigh-news": "Oakleigh Central News",
};

const ORDERS_ROWS = [
  { date: "16 Oct 2025", status: "Dropped Off", statusClass: "dropped", tracking: "YTG8580001001", booking: "PGAACLU33", order: "#1000", route: "Drop at PARCE…", place: "Cash Mall, H…", recipient: "Roshant…", price: "$4.50" },
  { date: "16 Oct 2025", status: "Picked Up", statusClass: "picked", tracking: "YTG8580001002", booking: "PGAACLU34", order: "#1001", route: "Collect from M…", place: "Box Hill, VIC…", recipient: "Sarah M…", price: "$9.20" },
  { date: "14 Oct 2025", status: "Attempted Pi…", statusClass: "attempted", tracking: "MP8015925154", booking: "PGAACLF73", order: "#1015", route: "Collect from M…", place: "Box Hill, VIC…", recipient: "Roshant…", price: "$10.40" },
  { date: "14 Oct 2025", status: "Dropped Off", statusClass: "dropped", tracking: "YTG8580001004", booking: "PGAACLU36", order: "#1002", route: "Drop at PARCE…", place: "Clayton, VIC…", recipient: "James L…", price: "$6.80" },
  { date: "12 Oct 2025", status: "Out for Deliv…", statusClass: "out", tracking: "MP8015925155", booking: "PGAACLF74", order: "#1016", route: "Drop at PARCE…", place: "Haymarket, …", recipient: "Roshant…", price: "$9.90" },
  { date: "9 Oct 2025", status: "Attempted Pi…", statusClass: "attempted", tracking: "MP8015925156", booking: "PGAACLF75", order: "#1017", route: "Drop at PARCE…", place: "Oakleigh, …", recipient: "Priya K…", price: "$8.10" },
  { date: "25 Sep 2025", status: "Dropped Off", statusClass: "dropped", tracking: "YTG8580001007", booking: "PGAACLU39", order: "#1005", route: "Drop at PARCE…", place: "Caulfield, …", recipient: "Tom H…", price: "$5.60" },
  { date: "22 Sep 2025", status: "Picked Up", statusClass: "picked", tracking: "YTG8580001008", booking: "PGAACLU40", order: "#1006", route: "Collect from M…", place: "Richmond, …", recipient: "Anna W…", price: "$11.30" },
];

function getSelectedDropoffLocationValue() {
  return document.querySelector('input[name="dropoff-location"]:checked')?.value || "bp-clayton";
}

function getSelectedDropoffLabel() {
  return DROPOFF_LOCATION_LABELS[getSelectedDropoffLocationValue()] || "BP Clayton";
}

function updateOrdersDropoffPill() {
  if (ordersDropoffName) {
    ordersDropoffName.textContent = getSelectedDropoffLabel();
  }
}

function renderOrdersTable() {
  if (!ordersTableBody) return;
  const rows = [];
  for (let i = 0; i < 20; i += 1) {
    const row = ORDERS_ROWS[i % ORDERS_ROWS.length];
    rows.push(`
      <tr>
        <td class="orders-table__check"><input type="checkbox" aria-label="Select order ${row.order}" /></td>
        <td>${row.date}</td>
        <td><span class="status-badge status-badge--${row.statusClass}">${row.status}</span></td>
        <td class="orders-table__tracking">${row.tracking}</td>
        <td>${row.booking}</td>
        <td class="orders-table__order">${row.order}</td>
        <td>${row.route}<br /><span style="color:#6b7280">${row.place}</span></td>
        <td>${row.recipient}</td>
        <td><strong>${row.price}</strong></td>
        <td class="orders-table__label">
          <button type="button" class="orders-label-btn" aria-label="Download label for ${row.order}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 3v10M6 9l4 4 4-4M4 14v2h12v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </td>
      </tr>
    `);
  }
  ordersTableBody.innerHTML = rows.join("");
}

function showOrdersView() {
  if (flowCard) flowCard.hidden = true;
  if (stepDropoff) stepDropoff.hidden = true;
  if (ordersView) ordersView.hidden = false;
  document.body.classList.add("page-orders");
  document.body.classList.remove("page-dropoff");
  updateOrdersDropoffPill();
  renderOrdersTable();
  document.title = "Orders";
}

function restartOnboarding() {
  if (ordersView) ordersView.hidden = true;
  document.body.classList.remove("page-orders");
  if (flowCard) flowCard.hidden = false;
  showMobileStep();
}

function setProgressStep(step) {
  const current = Math.max(1, Math.min(step, progressSteps.length));
  progressSteps.forEach((el, index) => {
    const n = index + 1;
    el.classList.remove("progress__step--active", "progress__step--complete", "progress__step--current");
    if (n < current) {
      el.classList.add("progress__step--complete");
    } else if (n === current) {
      el.classList.add("progress__step--current");
    }
  });
  if (progressBar) {
    progressBar.setAttribute("aria-valuenow", String(current));
    progressBar.dataset.step = String(current);
    progressBar.hidden = false;
    progressBar.classList.remove("progress--hidden");
  }
}

function showOnlyStep(activeStep) {
  flowSteps.forEach((section) => {
    const isActive = section === activeStep;
    section.hidden = !isActive;
    section.classList.toggle("step--hidden", !isActive);
  });
}

function showMobileStep() {
  showOnlyStep(stepMobile);
  document.title = "Link your PARCELPOINT Go account";
  setProgressStep(1);
  input.focus();
}

function showCodeStep(digits) {
  savedMobileDigits = digits;
  codeSentTo.textContent = formatPhoneInternational(digits);
  showOnlyStep(stepCode);
  document.title = "Enter the code";
  setProgressStep(2);
  otpInputs.forEach((el) => {
    el.value = "";
  });
  otpInputs[0].focus();
}

function showDetailsStep() {
  showOnlyStep(stepDetails);
  document.title = "Your details";
  setProgressStep(3);
  if (savedMobileDigits && detailsPhoneInput) {
    detailsPhoneInput.value = formatDisplay(savedMobileDigits);
  }
  firstNameInput?.focus();
}

function showConnectStep() {
  showOnlyStep(stepConnect);
  document.title = "Connect your store";
  setProgressStep(4);
  if (flowCard) flowCard.hidden = false;
  if (stepDropoff) stepDropoff.hidden = true;
  document.body.classList.remove("page-dropoff");
}

function showDropoffStep() {
  if (flowCard) flowCard.hidden = true;
  if (stepDropoff) stepDropoff.hidden = false;
  if (ordersView) ordersView.hidden = true;
  document.body.classList.remove("page-orders");
  document.title = "How do you send parcels?";
  document.body.classList.add("page-dropoff");
  dropoffToggle?.focus();
}

input.addEventListener("input", () => {
  const digits = normalizeDigits(input.value);
  input.value = formatDisplay(digits);
  hint.textContent = defaultHint;
  hint.style.color = defaultHintColor;
});

detailsPhoneInput?.addEventListener("input", () => {
  const digits = normalizeDigits(detailsPhoneInput.value);
  detailsPhoneInput.value = formatDisplay(digits);
  detailsPhoneWrap?.classList.remove("phone-input--invalid");
});

mobileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const digits = normalizeDigits(input.value);

  if (!isValidAuMobile(digits)) {
    phoneWrap.classList.add("phone-input--invalid");
    hint.textContent = defaultHint;
    hint.style.color = "var(--hint-error)";
    input.focus();
    return;
  }

  phoneWrap.classList.remove("phone-input--invalid");
  showCodeStep(digits);
});

input.addEventListener("focus", () => {
  phoneWrap.classList.remove("phone-input--invalid");
});

useDifferentNumber.addEventListener("click", () => {
  showMobileStep();
});

resendCode.addEventListener("click", () => {
  otpInputs.forEach((el) => {
    el.value = "";
  });
  otpInputs[0].focus();
});

function focusOtpIndex(index) {
  const i = Math.max(0, Math.min(index, otpInputs.length - 1));
  otpInputs[i].focus();
  otpInputs[i].select();
}

otpInputs.forEach((el, index) => {
  el.addEventListener("input", () => {
    const digit = normalizeDigits(el.value).slice(-1);
    el.value = digit;
    if (digit && index < otpInputs.length - 1) {
      focusOtpIndex(index + 1);
    }
  });

  el.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !el.value && index > 0) {
      focusOtpIndex(index - 1);
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusOtpIndex(index - 1);
    }
    if (e.key === "ArrowRight" && index < otpInputs.length - 1) {
      e.preventDefault();
      focusOtpIndex(index + 1);
    }
  });

  el.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = normalizeDigits(e.clipboardData.getData("text")).slice(0, 6);
    pasted.split("").forEach((char, i) => {
      if (otpInputs[i]) otpInputs[i].value = char;
    });
    focusOtpIndex(Math.min(pasted.length, otpInputs.length - 1));
  });
});

codeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const code = otpInputs.map((el) => el.value).join("");
  if (code.length !== 6) {
    focusOtpIndex(code.length);
    return;
  }
  showDetailsStep();
});

detailsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const phoneDigits = normalizeDigits(detailsPhoneInput.value);
  if (phoneDigits) {
    savedMobileDigits = phoneDigits;
  }
  showConnectStep();
});

detailsBack.addEventListener("click", () => {
  showCodeStep(savedMobileDigits);
  focusOtpIndex(0);
});

connectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showDropoffStep();
});

function setDropoffLocationsEnabled(enabled) {
  dropoffLocations?.classList.toggle("is-disabled", !enabled);
}

dropoffToggle?.addEventListener("change", () => {
  setDropoffLocationsEnabled(dropoffToggle.checked);
});

setDropoffLocationsEnabled(dropoffToggle?.checked ?? true);

dropoffSave?.addEventListener("click", () => {
  showOrdersView();
});

function setDropoffModalLocationsEnabled(enabled) {
  dropoffModalLocations?.classList.toggle("is-disabled", !enabled);
}

function syncMainDropoffToModal() {
  if (dropoffModalToggle && dropoffToggle) {
    dropoffModalToggle.checked = dropoffToggle.checked;
  }
  const mainSelected = document.querySelector('input[name="dropoff-location"]:checked')?.value;
  if (mainSelected) {
    const modalRadio = document.querySelector(
      `input[name="dropoff-location-modal"][value="${mainSelected}"]`
    );
    if (modalRadio) modalRadio.checked = true;
  }
  setDropoffModalLocationsEnabled(dropoffModalToggle?.checked ?? true);
}

function syncModalDropoffToMain() {
  if (dropoffToggle && dropoffModalToggle) {
    dropoffToggle.checked = dropoffModalToggle.checked;
  }
  const modalSelected = document.querySelector('input[name="dropoff-location-modal"]:checked')?.value;
  if (modalSelected) {
    const mainRadio = document.querySelector(
      `input[name="dropoff-location"][value="${modalSelected}"]`
    );
    if (mainRadio) mainRadio.checked = true;
  }
  setDropoffLocationsEnabled(dropoffToggle?.checked ?? true);
}

function setDropoffSettingsModalOpen(open) {
  if (!dropoffSettingsModal) return;
  dropoffSettingsModal.hidden = !open;
  document.body.classList.toggle("modal-open", open);
  if (open) {
    syncMainDropoffToModal();
    modalDialog?.focus();
  }
}

warehouseChange?.addEventListener("click", () => {
  setDropoffSettingsModalOpen(true);
});

dropoffSettingsClose?.addEventListener("click", () => {
  setDropoffSettingsModalOpen(false);
});

dropoffSettingsCancel?.addEventListener("click", () => {
  setDropoffSettingsModalOpen(false);
});

dropoffSettingsModal?.addEventListener("click", (e) => {
  if (e.target === dropoffSettingsModal) {
    setDropoffSettingsModalOpen(false);
  }
});

dropoffModalToggle?.addEventListener("change", () => {
  setDropoffModalLocationsEnabled(dropoffModalToggle.checked);
});

dropoffSettingsSave?.addEventListener("click", () => {
  syncModalDropoffToMain();
  updateOrdersDropoffPill();
  setDropoffSettingsModalOpen(false);
});

ordersDropoffSettings?.addEventListener("click", () => {
  setDropoffSettingsModalOpen(true);
});

restartOnboardingBtn?.addEventListener("click", () => {
  restartOnboarding();
});

document.querySelectorAll(".orders-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".orders-filter").forEach((el) => {
      el.classList.toggle("orders-filter--active", el === btn);
    });
  });
});

connectBack.addEventListener("click", () => {
  showDetailsStep();
});

setProgressStep(1);

const topBarMenu = document.getElementById("top-bar-menu");
const topBarDropdown = document.getElementById("top-bar-dropdown");

function setMenuOpen(open) {
  if (!topBarMenu || !topBarDropdown) return;
  topBarMenu.setAttribute("aria-expanded", open ? "true" : "false");
  topBarDropdown.hidden = !open;
}

topBarMenu?.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = topBarMenu.getAttribute("aria-expanded") === "true";
  setMenuOpen(!isOpen);
});

topBarDropdown?.querySelectorAll(".top-bar__dropdown-item").forEach((item) => {
  item.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("click", () => setMenuOpen(false));

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (dropoffSettingsModal && !dropoffSettingsModal.hidden) {
    setDropoffSettingsModalOpen(false);
    return;
  }
  setMenuOpen(false);
});
