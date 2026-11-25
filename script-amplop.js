// GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxd-CyCszwZtUMB1ENm2xvpRz0PLGSxa3H_wJ1v6H9KQ1uZ0Kyz56sUT1LTgftB_8rA/exec";

// Referensi format asli (Bold & Merah) jika sel di Google Sheets masih plain text
const DEFAULT_BOLD_BY_TIM = {
  "Tim 1": ["lucia", "buntoro"],
  "Tim 2": ["anik", "anung", "eti"],
  "Tim 3": ["kathrina", "tatu"],
  "Tim 4": ["helena", "santi", "martin"],
  "Tim 5": ["stereo", "titis"],
  "Tim 6": ["cai ing", "henry"],
  "Tim 7": ["rina", "ivan"]
};

const DEFAULT_RED_NAMES = new Set([
  "hugo", "webe", "feroz", "jason", "justin", "jovan", "ferry",
  "agnes", "jojo", "stefen (jojo)", "stefen", "cindy",
  "francis", "reval", "michelle", "fanny",
  "olin", "christo", "jovian", "brandon",
  "evo", "jonathan", "dendi", "rafael", "anna", "florence",
  "archie", "quinn", "ela", "claire", "alda", "felice", "tasya",
  "sianly", "miracle", "gaby", "kezia gg", "jannice", "janice",
  "grisela", "sandra", "kezia gp", "geneva gp"
]);

let allScheduleData = [];
let isAdminMode = false;
let adminPassword = "";

// Elemen DOM
const filterAdven = document.getElementById("filterAdven");
const filterTanggal = document.getElementById("filterTanggal");
const filterJam = document.getElementById("filterJam");
const filterSearch = document.getElementById("filterSearch");
const resultSummary = document.getElementById("resultSummary");
const scheduleContainer = document.getElementById("scheduleContainer");

const btnRefresh = document.getElementById("btnRefresh");
const btnReset = document.getElementById("btnReset");
const adminBanner = document.getElementById("adminBanner");
const btnOpenAdminModal = document.getElementById("btnOpenAdminModal");
const btnLogoutAdmin = document.getElementById("btnLogoutAdmin");

// Modal Login
const modalAdminLogin = document.getElementById("modalAdminLogin");
const formAdminLogin = document.getElementById("formAdminLogin");
const inputAdminPassword = document.getElementById("inputAdminPassword");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const btnCancelLogin = document.getElementById("btnCancelLogin");
const btnSubmitLogin = document.getElementById("btnSubmitLogin");

// Modal Edit
const modalEditName = document.getElementById("modalEditName");
const formEditName = document.getElementById("formEditName");
const editContextInfo = document.getElementById("editContextInfo");
const editRowIndex = document.getElementById("editRowIndex");
const inputNewName = document.getElementById("inputNewName");
const chkIsBold = document.getElementById("chkIsBold");
const chkIsRed = document.getElementById("chkIsRed");
const editErrorMsg = document.getElementById("editErrorMsg");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const btnSubmitEdit = document.getElementById("btnSubmitEdit");

const toastNotification = document.getElementById("toastNotification");

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  fetchScheduleData();
});

function bindEvents() {
  filterAdven.addEventListener("change", () => {
    populateTanggalOptions();
    populateJamOptions();
    renderSchedule();
  });

  filterTanggal.addEventListener("change", () => {
    populateJamOptions();
    renderSchedule();
  });

  filterJam.addEventListener("change", renderSchedule);
  filterSearch.addEventListener("input", renderSchedule);

  btnReset.addEventListener("click", () => {
    filterAdven.value = "";
    populateTanggalOptions();
    populateJamOptions();
    filterSearch.value = "";
    renderSchedule();
  });

  btnRefresh.addEventListener("click", fetchScheduleData);

  // Admin Login Modal
  btnOpenAdminModal.addEventListener("click", () => {
    if (isAdminMode) {
      showToast("Anda sudah berada di Mode Admin.");
      return;
    }
    loginErrorMsg.classList.add("hidden");
    inputAdminPassword.value = "";
    modalAdminLogin.classList.remove("hidden");
    inputAdminPassword.focus();
  });

  btnCancelLogin.addEventListener("click", () => {
    modalAdminLogin.classList.add("hidden");
  });

  formAdminLogin.addEventListener("submit", handleAdminLogin);

  btnLogoutAdmin.addEventListener("click", () => {
    isAdminMode = false;
    adminPassword = "";
    adminBanner.classList.add("hidden");
    btnOpenAdminModal.classList.remove("hidden");
    renderSchedule();
    showToast("Keluar dari Mode Admin.");
  });

  // Edit Modal
  btnCancelEdit.addEventListener("click", () => {
    modalEditName.classList.add("hidden");
  });

  formEditName.addEventListener("submit", handleSaveEditedName);
}

// Ambil data dari Google Apps Script (menggunakan JSONP agar bebas masalah CORS di GitHub Pages)
function fetchScheduleData() {
  scheduleContainer.innerHTML = `
    <div class="loading-box">
      <div class="spinner"></div>
      <p>Memuat jadwal petugas amplop...</p>
    </div>
  `;

  const callbackName = "handleGasSchedule_" + Date.now();
  const script = document.createElement("script");

  window[callbackName] = function (res) {
    delete window[callbackName];
    script.remove();

    if (!res || !res.success) {
      scheduleContainer.innerHTML = `
        <div class="empty-box">
          <p>Gagal memuat data: ${escapeHtml(res && res.message ? res.message : "Periksa URL Apps Script")}</p>
        </div>
      `;
      return;
    }

    allScheduleData = (res.data || []).map(enrichFormatFlags);
    populateAdvenOptions();
    populateTanggalOptions();
    populateJamOptions();
    renderSchedule();
  };

  script.onerror = function () {
    delete window[callbackName];
    script.remove();
    scheduleContainer.innerHTML = `
      <div class="empty-box">
        <p>Tidak dapat terhubung ke server Google Apps Script. Pastikan URL deployment sudah benar.</p>
      </div>
    `;
  };

  script.src = `${GAS_WEB_APP_URL}?action=getSchedule&callback=${callbackName}`;
  document.body.appendChild(script);
}

// Pertahankan format Bold & Merah (dari properti Sheets maupun fallback daftar asli)
function enrichFormatFlags(item) {
  const lowerName = item.nama.toLowerCase().trim();
  const timKey = item.tim.trim();

  // Pengecualian khusus: Anik di Adven IV Tim 2 tidak ada, sedangkan Eti di Adven IV Tim 2 Bold
  let fallbackBold = false;
  if (item.no.toLowerCase().includes("adven iv") && timKey === "Tim 2") {
    fallbackBold = ["anung", "eti"].includes(lowerName);
  } else {
    const boldList = DEFAULT_BOLD_BY_TIM[timKey] || [];
    fallbackBold = boldList.includes(lowerName);
  }

  const fallbackRed = DEFAULT_RED_NAMES.has(lowerName);

  return {
    ...item,
    isBold: item.isBold || fallbackBold,
    isRed: item.isRed || fallbackRed
  };
}

function populateAdvenOptions() {
  const current = filterAdven.value;
  const uniqueAdven = [...new Set(allScheduleData.map(d => d.no).filter(Boolean))];
  filterAdven.innerHTML = `<option value="">Semua Minggu Adven</option>` +
    uniqueAdven.map(val => `<option value="${escapeHtml(val)}">${escapeHtml(val)}</option>`).join("");
  if (uniqueAdven.includes(current)) {
    filterAdven.value = current;
  }
}

function populateTanggalOptions() {
  const selectedAdven = filterAdven.value;
  const current = filterTanggal.value;
  const subset = selectedAdven
    ? allScheduleData.filter(d => d.no === selectedAdven)
    : allScheduleData;

  const uniqueTanggal = [...new Set(subset.map(d => d.hariTanggal).filter(Boolean))];
  filterTanggal.innerHTML = `<option value="">Semua Hari / Tanggal</option>` +
    uniqueTanggal.map(val => `<option value="${escapeHtml(val)}">${escapeHtml(val)}</option>`).join("");
  if (uniqueTanggal.includes(current)) {
    filterTanggal.value = current;
  }
}

function populateJamOptions() {
  const selectedAdven = filterAdven.value;
  const selectedTanggal = filterTanggal.value;
  const current = filterJam.value;

  const subset = allScheduleData.filter(d => {
    if (selectedAdven && d.no !== selectedAdven) return false;
    if (selectedTanggal && d.hariTanggal !== selectedTanggal) return false;
    return true;
  });

  const uniqueJam = [...new Set(subset.map(d => d.jamMisa).filter(Boolean))].sort();
  filterJam.innerHTML = `<option value="">Semua Jam Misa</option>` +
    uniqueJam.map(val => `<option value="${escapeHtml(val)}">${escapeHtml(val)}</option>`).join("");
  if (uniqueJam.includes(current)) {
    filterJam.value = current;
  }
}

function renderSchedule() {
  const selectedAdven = filterAdven.value;
  const selectedTanggal = filterTanggal.value;
  const selectedJam = filterJam.value;
  const keyword = filterSearch.value.trim().toLowerCase();

  const filtered = allScheduleData.filter(item => {
    if (selectedAdven && item.no !== selectedAdven) return false;
    if (selectedTanggal && item.hariTanggal !== selectedTanggal) return false;
    if (selectedJam && item.jamMisa !== selectedJam) return false;
    if (keyword) {
      const matchName = item.nama.toLowerCase().includes(keyword);
      const matchTim = item.tim.toLowerCase().includes(keyword);
      if (!matchName && !matchTim) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    resultSummary.textContent = "0 petugas ditemukan";
    scheduleContainer.innerHTML = `
      <div class="empty-box">
        <p>Tidak ada jadwal petugas yang sesuai dengan filter yang dipilih.</p>
      </div>
    `;
    return;
  }

  // Kelompokkan: Minggu Adven -> Hari/Tanggal -> Jam Misa + TIM
  const advenGroups = new Map();
  filtered.forEach(item => {
    if (!advenGroups.has(item.no)) {
      advenGroups.set(item.no, new Map());
    }
    const dateMap = advenGroups.get(item.no);
    if (!dateMap.has(item.hariTanggal)) {
      dateMap.set(item.hariTanggal, new Map());
    }
    const slotKey = `${item.jamMisa}|||${item.tim}`;
    const slotMap = dateMap.get(item.hariTanggal);
    if (!slotMap.has(slotKey)) {
      slotMap.set(slotKey, {
        jamMisa: item.jamMisa,
        tim: item.tim,
        members: []
      });
    }
    slotMap.get(slotKey).members.push(item);
  });

  let totalSlots = 0;
  let html = "";

  advenGroups.forEach((dateMap, advenTitle) => {
    html += `<section class="adven-section">`;
    html += `<div class="adven-header"><h2>${escapeHtml(advenTitle.toUpperCase())}</h2></div>`;

    dateMap.forEach((slotMap, tanggalTitle) => {
      html += `<div class="date-block">`;
      html += `<div class="date-title">${escapeHtml(tanggalTitle)}</div>`;
      html += `<div class="mass-grid">`;

      slotMap.forEach(slot => {
        totalSlots++;
        html += `<article class="mass-card">`;
        html += `
          <div class="mass-card-header">
            <span class="mass-time">${escapeHtml(slot.jamMisa)}</span>
            <span class="mass-tim">${escapeHtml(slot.tim)}</span>
          </div>
          <div class="names-list">
        `;

        slot.members.forEach(member => {
          const classes = ["petugas-chip"];
          if (member.isBold) classes.push("is-bold");
          if (member.isRed) classes.push("is-red");

          const editBtn = isAdminMode
            ? `<button type="button" class="btn-edit-name" data-row="${member.rowIndex}" title="Ubah nama">✎</button>`
            : "";

          html += `
            <span class="${classes.join(" ")}">
              <span>${escapeHtml(member.nama)}</span>
              ${editBtn}
            </span>
          `;
        });

        html += `</div></article>`;
      });

      html += `</div></div>`;
    });

    html += `</section>`;
  });

  resultSummary.textContent = `Menampilkan ${filtered.length} petugas dalam ${totalSlots} jadwal misa`;
  scheduleContainer.innerHTML = html;

  // Pasang event listener untuk tombol edit jika mode admin aktif
  if (isAdminMode) {
    document.querySelectorAll(".btn-edit-name").forEach(btn => {
      btn.addEventListener("click", () => {
        const rowIdx = parseInt(btn.getAttribute("data-row"), 10);
        openEditModal(rowIdx);
      });
    });
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const pwd = inputAdminPassword.value.trim();
  if (!pwd) return;

  btnSubmitLogin.disabled = true;
  btnSubmitLogin.textContent = "Memeriksa...";
  loginErrorMsg.classList.add("hidden");

  const callbackName = "verifyAdminCb_" + Date.now();
  const script = document.createElement("script");

  window[callbackName] = function (res) {
    delete window[callbackName];
    script.remove();
    btnSubmitLogin.disabled = false;
    btnSubmitLogin.textContent = "Masuk";

    if (res && res.success) {
      isAdminMode = true;
      adminPassword = pwd;
      modalAdminLogin.classList.add("hidden");
      adminBanner.classList.remove("hidden");
      btnOpenAdminModal.classList.add("hidden");
      renderSchedule();
      showToast("Mode Admin aktif.");
    } else {
      loginErrorMsg.textContent = (res && res.message) ? res.message : "Password salah.";
      loginErrorMsg.classList.remove("hidden");
    }
  };

  script.onerror = function () {
    delete window[callbackName];
    script.remove();
    btnSubmitLogin.disabled = false;
    btnSubmitLogin.textContent = "Masuk";
    loginErrorMsg.textContent = "Gagal menghubungi server.";
    loginErrorMsg.classList.remove("hidden");
  };

  script.src = `${GAS_WEB_APP_URL}?action=verifyAdmin&password=${encodeURIComponent(pwd)}&callback=${callbackName}`;
  document.body.appendChild(script);
}

function openEditModal(rowIndex) {
  const target = allScheduleData.find(item => item.rowIndex === rowIndex);
  if (!target) return;

  editRowIndex.value = target.rowIndex;
  inputNewName.value = target.nama;
  chkIsBold.checked = Boolean(target.isBold);
  chkIsRed.checked = Boolean(target.isRed);
  editContextInfo.textContent = `${target.no} • ${target.hariTanggal} • ${target.jamMisa} (${target.tim})`;
  editErrorMsg.classList.add("hidden");

  modalEditName.classList.remove("hidden");
  inputNewName.focus();
  inputNewName.select();
}

async function handleSaveEditedName(e) {
  e.preventDefault();
  const rowIndex = parseInt(editRowIndex.value, 10);
  const newName = inputNewName.value.trim();
  const isBold = chkIsBold.checked;
  const isRed = chkIsRed.checked;

  if (!newName) {
    editErrorMsg.textContent = "Nama petugas tidak boleh kosong.";
    editErrorMsg.classList.remove("hidden");
    return;
  }

  btnSubmitEdit.disabled = true;
  btnSubmitEdit.textContent = "Menyimpan...";
  editErrorMsg.classList.add("hidden");

  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "updateName",
        password: adminPassword,
        rowIndex: rowIndex,
        newName: newName,
        isBold: isBold,
        isRed: isRed
      })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Gagal menyimpan perubahan.");
    }

    // Perbarui state lokal secara langsung
    const idx = allScheduleData.findIndex(item => item.rowIndex === rowIndex);
    if (idx !== -1) {
      allScheduleData[idx].nama = result.updated.nama;
      allScheduleData[idx].isBold = result.updated.isBold;
      allScheduleData[idx].isRed = result.updated.isRed;
    }

    modalEditName.classList.add("hidden");
    renderSchedule();
    showToast("Nama petugas berhasil diperbarui.");
  } catch (err) {
    editErrorMsg.textContent = err.message || "Terjadi kesalahan saat menyimpan.";
    editErrorMsg.classList.remove("hidden");
  } finally {
    btnSubmitEdit.disabled = false;
    btnSubmitEdit.textContent = "Simpan Perubahan";
  }
}

let toastTimer = null;
function showToast(msg) {
  toastNotification.textContent = msg;
  toastNotification.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastNotification.classList.add("hidden");
  }, 3000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}