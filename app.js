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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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
const flowSteps = [stepMobile, stepCode, stepDetails, stepConnect];
const connectForm = document.getElementById("connect-form");
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

  const first = firstNameInput.value.trim();
  const last = lastNameInput.value.trim();
  const email = emailInput.value.trim();
  const phoneDigits = normalizeDigits(detailsPhoneInput.value);

  firstNameInput.classList.toggle("text-input--invalid", !first);
  lastNameInput.classList.toggle("text-input--invalid", !last);
  emailInput.classList.toggle("text-input--invalid", !isValidEmail(email));
  detailsPhoneWrap?.classList.toggle("phone-input--invalid", !isValidAuMobile(phoneDigits));

  if (!first) {
    firstNameInput.focus();
    return;
  }
  if (!last) {
    lastNameInput.focus();
    return;
  }
  if (!isValidEmail(email)) {
    emailInput.focus();
    return;
  }
  if (!isValidAuMobile(phoneDigits)) {
    detailsPhoneInput.focus();
    return;
  }

  savedMobileDigits = phoneDigits;
  showConnectStep();
});

[firstNameInput, lastNameInput, emailInput].forEach((el) => {
  el?.addEventListener("input", () => el.classList.remove("text-input--invalid"));
});

detailsBack.addEventListener("click", () => {
  showCodeStep(savedMobileDigits);
  focusOtpIndex(0);
});

connectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("Connect store for", formatPhoneInternational(savedMobileDigits));
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
  if (e.key === "Escape") setMenuOpen(false);
});
