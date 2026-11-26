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
let currentFilteredData = [];
let isAdminMode = false;
let adminPassword = "";

// Elemen DOM
const filterAdven = document.getElementById("filterAdven");
const filterTanggal = document.getElementById("filterTanggal");
const filterJam = document.getElementById("filterJam");
const filterSearch = document.getElementById("filterSearch");
const resultSummary = document.getElementById("resultSummary");
const scheduleContainer = document.getElementById("scheduleContainer");

const btnExportImage = document.getElementById("btnExportImage");
const btnRefresh = document.getElementById("btnRefresh");
const btnReset = document.getElementById("btnReset");
const adminBanner = document.getElementById("adminBanner");
const btnOpenAdminModal = document.getElementById("btnOpenAdminModal");
const btnLogoutAdmin = document.getElementById("btnLogoutAdmin");
const exportRenderWrapper = document.getElementById("exportRenderWrapper");

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
  btnExportImage.addEventListener("click", exportFilteredScheduleAsImage);

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

// Ambil data dari Google Apps Script
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
        <p>Tidak dapat terhubung ke server, coba incognito atau masuk ke setting - google services - matikan allow Chrome Sign-in.</p>
      </div>
    `;
  };

  script.src = `${GAS_WEB_APP_URL}?action=getSchedule&callback=${callbackName}`;
  document.body.appendChild(script);
}

// Pertahankan format Bold & Merah
function enrichFormatFlags(item) {
  const lowerName = item.nama.toLowerCase().trim();
  const timKey = item.tim.trim();

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

  currentFilteredData = filtered;

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

  if (isAdminMode) {
    document.querySelectorAll(".btn-edit-name").forEach(btn => {
      btn.addEventListener("click", () => {
        const rowIdx = parseInt(btn.getAttribute("data-row"), 10);
        openEditModal(rowIdx);
      });
    });
  }
}

// =========================================================
// EXPORT TABEL GAMBAR PNG PERSIS SEPERTI GAMBAR PERTAMA
// =========================================================
async function exportFilteredScheduleAsImage() {
  if (!currentFilteredData || currentFilteredData.length === 0) {
    showToast("Tidak ada data jadwal untuk di-export.");
    return;
  }

  if (typeof html2canvas === "undefined") {
    showToast("Pustaka export gambar belum termuat. Periksa koneksi internet.");
    return;
  }

  btnExportImage.disabled = true;
  const originalText = btnExportImage.textContent;
  btnExportImage.textContent = "Membuat Gambar...";

  try {
    // Susun hierarki: Minggu Adven -> Hari/Tanggal -> Slot (Jam Misa + TIM)
    const advenMap = new Map();

    currentFilteredData.forEach(item => {
      if (!advenMap.has(item.no)) {
        advenMap.set(item.no, new Map());
      }
      const hariMap = advenMap.get(item.no);
      if (!hariMap.has(item.hariTanggal)) {
        hariMap.set(item.hariTanggal, new Map());
      }
      const slotMap = hariMap.get(item.hariTanggal);
      const slotKey = `${item.jamMisa}|||${item.tim}`;
      if (!slotMap.has(slotKey)) {
        slotMap.set(slotKey, {
          jamMisa: item.jamMisa,
          tim: item.tim,
          members: []
        });
      }
      slotMap.get(slotKey).members.push(item);
    });

    let tableRowsHtml = "";

    advenMap.forEach((hariMap, advenTitle) => {
      let totalAdvenRows = 0;
      hariMap.forEach(slotMap => {
        totalAdvenRows += slotMap.size;
      });

      const formattedAdven = escapeHtml(advenTitle.toUpperCase()).replace(/^MINGGU\s+/, "MINGGU<br>");

      let advenRowCounter = 0;
      const hariEntries = Array.from(hariMap.entries());

      hariEntries.forEach(([hariTitle, slotMap], hariIdx) => {
        const totalHariRows = slotMap.size;
        const isLastHariInAdven = (hariIdx === hariEntries.length - 1);
        const formattedHari = escapeHtml(hariTitle).replace(/,\s*/, ",<br>");

        const slotEntries = Array.from(slotMap.values());
        slotEntries.forEach((slot, slotIdx) => {
          advenRowCounter++;
          const isLastRowInAdven = (advenRowCounter === totalAdvenRows);

          const namesHtml = slot.members.map(m => {
            let cls = "exp-name-normal";
            if (m.isBold) cls = "exp-name-bold";
            else if (m.isRed) cls = "exp-name-red";
            return `<span class="${cls}">${escapeHtml(m.nama)}</span>`;
          }).join(", ");

          tableRowsHtml += `<tr class="${isLastRowInAdven ? "adven-last-row" : ""}">`;

          if (advenRowCounter === 1) {
            tableRowsHtml += `<td class="col-no" rowspan="${totalAdvenRows}">${formattedAdven}</td>`;
          }

          if (slotIdx === 0) {
            const hariCellClass = isLastHariInAdven ? "col-hari hari-last-cell" : "col-hari";
            tableRowsHtml += `<td class="${hariCellClass}" rowspan="${totalHariRows}">${formattedHari}</td>`;
          }

          tableRowsHtml += `
            <td class="col-jam">${escapeHtml(slot.jamMisa)}</td>
            <td class="col-tim">${escapeHtml(slot.tim)}</td>
            <td class="col-nama">${namesHtml}</td>
          `;
          tableRowsHtml += `</tr>`;
        });
      });
    });

    exportRenderWrapper.innerHTML = `
      <table class="classic-export-table" id="targetExportTable">
        <thead>
          <tr>
            <th>NO</th>
            <th>HARI / TGL</th>
            <th>JAM MISA</th>
            <th>TIM</th>
            <th>NAMA</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    `;

    // Pastikan browser mengukur tinggi & lebar penuh tabel terlebih dahulu
    exportRenderWrapper.style.visibility = "visible";
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 60)));

    const fullWidth = exportRenderWrapper.offsetWidth;
    const fullHeight = exportRenderWrapper.offsetHeight;

    const canvas = await html2canvas(exportRenderWrapper, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      x: 0,
      y: 0,
      width: fullWidth,
      height: fullHeight,
      windowWidth: fullWidth + 40,
      windowHeight: fullHeight + 40,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const clonedWrapper = clonedDoc.getElementById("exportRenderWrapper");
        clonedDoc.body.innerHTML = "";
        clonedDoc.body.style.margin = "0";
        clonedDoc.body.style.padding = "0";
        clonedDoc.body.style.background = "#ffffff";
        clonedDoc.body.style.width = fullWidth + "px";
        clonedDoc.body.style.height = fullHeight + "px";

        clonedWrapper.style.position = "static";
        clonedWrapper.style.visibility = "visible";
        clonedWrapper.style.zIndex = "1";
        clonedWrapper.style.margin = "0";
        clonedDoc.body.appendChild(clonedWrapper);
      }
    });

    exportRenderWrapper.style.visibility = "hidden";

    // Buat nama file dinamis sesuai filter yang aktif
    const parts = ["Jadwal_Amplop"];
    if (filterAdven.value) parts.push(filterAdven.value.replace(/\s+/g, "_"));
    if (filterTanggal.value) parts.push(filterTanggal.value.replace(/[^a-zA-Z0-9]+/g, "_"));
    if (filterJam.value) parts.push(filterJam.value.replace(/[^a-zA-Z0-9]+/g, "_"));
    const filename = parts.join("_") + ".png";

    canvas.toBlob((blob) => {
      if (!blob) {
        showToast("Gagal mengonversi gambar.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      exportRenderWrapper.innerHTML = "";
      showToast("Gambar jadwal berhasil diunduh.");
    }, "image/png");
  } catch (err) {
    exportRenderWrapper.style.visibility = "hidden";
    showToast("Gagal membuat gambar: " + (err.message || err));
  } finally {
    btnExportImage.disabled = false;
    btnExportImage.textContent = originalText;
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