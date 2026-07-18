
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
function saveRow(row) {
  const updatedData = getRowData(row);
  if (updatedData.count - updatedData.reserve - updatedData.freeze < 0){
    alert('Not enough part aveilable!!!')
    return
  }

  fetch("/anbar/parts/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie('csrftoken')
    },
    body: JSON.stringify(updatedData)
  })
  .then(res => res.json())
  .then(data => {
    console.log("Server response:", data);
    if (data.status === "success") {
      alert("✅ Changes saved successfully!");
    } else {
      alert("⚠️ Error: " + data.message);
    }
  })
  .catch(err => {
    console.error(err);
    alert("❌ Could not save changes. Please try again.");
  });
}
function getRowData(row) {
  const cells = row.querySelectorAll("td");
  return {
    code_anbar: cells[0].textContent.trim(),
    failure: cells[3].textContent.trim(),
    description: cells[4].textContent.trim(),
    count: cells[5].textContent.trim(),
    reserve: cells[6].textContent.trim(),
    freeze: cells[7].textContent.trim(),
  };
}
document.addEventListener("click", (event) => {
  if (event.target.closest(".edit-btn")) {
    const btn = event.target.closest(".edit-btn");
    const row = btn.closest("tr");

    if (btn.dataset.mode === "edit") {
      row.dataset.original = JSON.stringify(getRowData(row));

      row.querySelectorAll("td").forEach((td, index) => {
        if (index === 3) {
          const current = td.textContent.trim();
          const values = ['accepted', 'rejected', 'conditional type_1', 'conditional type_2', 'conditional type_3'];
          let radiosHtml = '';
          values.forEach(val => {
            radiosHtml += `
              <label style="margin-right: 8px; font-size: 0.85em;">
                <input type="radio" name="failure_${row.rowIndex}" value="${val}" ${current === val ? 'checked' : ''}> ${val}<br>
              </label>
            `
          })
          td.innerHTML = radiosHtml;
        } else if (index === 4) {
          const value = td.textContent.trim();
          td.innerHTML = `<input type="text" value="${value}" style="width: 100px; padding: 2px;">`;
        } else if (index === 5) {
          const value = td.textContent.trim();
          td.innerHTML = `<input type="number" value="${value}" style="width: 100px; padding: 2px;">`;
        }
      });

      btn.dataset.mode = "save";
      btn.innerHTML = `
        <span class="save-actions">
          <button class="save-confirm-btn" style="background: none; border: none; cursor: pointer;">✔️</button>
          <button class="save-cancel-btn" style="background: none; border: none; cursor: pointer;">❌</button>
        </span>
      `
    }
  }
  if (event.target.closest(".save-confirm-btn")) {
    const row = event.target.closest("tr");
    const btn = row.querySelector(".edit-btn");

    row.querySelectorAll("td").forEach((td, index) => {
      if (index === 3) {
        const selected = td.querySelector('input[type="radio"]:checked');
        td.textContent = selected ? selected.value : '-';
      } else if (index === 4 || index === 5) {
        const input = td.querySelector("input");
        td.textContent = input.value.trim();
      }
    });

    btn.dataset.mode = "edit";
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20" fill="currentColor"><path d="M2 14.5V18h3.5L17 6.5l-3.5-3.5L2 14.5zM19.71 4.04a1.003 1.003 0 0 0 0-1.41L17.37.29a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.5 3.5 1.83-1.83z"/></svg>`;
    saveRow(row);
  }

  if (event.target.closest(".save-cancel-btn")) {
    const row = event.target.closest("tr");
    const btn = row.querySelector(".edit-btn");

    const original = JSON.parse(row.dataset.original);
    const cells = row.querySelectorAll("td");

    cells[3].textContent = original.failure || "-";
    cells[4].textContent = original.description || "-";
    cells[5].textContent = original.count || "-";

    btn.dataset.mode = "edit";
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20" fill="currentColor"><path d="M2 14.5V18h3.5L17 6.5l-3.5-3.5L2 14.5zM19.71 4.04a1.003 1.003 0 0 0 0-1.41L17.37.29a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.5 3.5 1.83-1.83z"/></svg>`;
  }
});

  document.addEventListener("DOMContentLoaded", () => {
  const currentFilters = {};
  let currentPage = 1;

  function debounce(func, delay = 400) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  }

  function sendSearch(page = 1) {
    currentPage = page;
    const params = new URLSearchParams();

    for (const [field, value] of Object.entries(currentFilters)) {
      if (value) {
        params.set(field, value);
      }
    }
    params.set("page", page);

    fetch(`?${params.toString()}`, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(res => res.json())
      .then(updateTable);
  }

  function createInput(th, field) {
    if (th.querySelector(".search-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "search-wrapper";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "4px";
    wrapper.style.marginTop = "6px";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search...";
    input.style.width = "100px";
    input.style.padding = "4px 6px";
    input.style.fontSize = "0.75em";
    input.style.border = "1px solid #9ec6f5";
    input.style.borderRadius = "4px";
    input.style.backgroundColor = "#eaf4ff";
    input.style.color = "#003366";
    input.style.textAlign = "center";

    input.value = currentFilters[field] || "";

    const reset = document.createElement("button");
    reset.textContent = "×";
    reset.style.fontSize = "0.85em";
    reset.style.padding = "2px 6px";
    reset.style.cursor = "pointer";
    reset.style.border = "1px solid #9ec6f5";
    reset.style.backgroundColor = "#d9ecff";
    reset.style.color = "#004080";
    reset.style.borderRadius = "4px";

    input.addEventListener("input", debounce(() => {
      currentFilters[field] = input.value.trim();
      sendSearch(1);
    }));

    reset.addEventListener("click", () => {
      input.value = "";
      currentFilters[field] = "";
      sendSearch(1);
    });

    wrapper.appendChild(input);
    wrapper.appendChild(reset);
    th.appendChild(wrapper);
    input.focus();
  }
  function createStatusFilter(th) {
    if (th.querySelector(".failure-filter")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "failure-filter";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.marginTop = "6px";
    wrapper.style.padding = "4px";
    wrapper.style.backgroundColor = "#eef6ff";
    wrapper.style.border = "1px solid #9ec6f5";
    wrapper.style.borderRadius = "6px";

    const statusMap = {
      "accepted": "ACCEPT",
      "rejected": "REJECT",
      "conditional type_1": "COND1",
      "conditional type_2": "COND2",
      "conditional type_3": "COND3"
    };

    for (const [labelText, codeValue] of Object.entries(statusMap)) {
      const label = document.createElement("label");
      label.style.fontSize = "0.75em";
      label.style.marginBottom = "2px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = codeValue;
      checkbox.style.marginRight = "4px";

      if (currentFilters.status && currentFilters.status.split(",").includes(codeValue)) {
        checkbox.checked = true;
      }

      checkbox.addEventListener("change", () => {
        const checkedValues = Array.from(wrapper.querySelectorAll("input[type=checkbox]:checked"))
          .map(cb => cb.value);
        currentFilters.failure = checkedValues.join(",");
        sendSearch(1);
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(labelText));
      wrapper.appendChild(label);
    }

    th.appendChild(wrapper);
  }

  function updateTable(data) {
  const tbody = document.querySelector("#resizable-table tbody");
  tbody.innerHTML = "";

  if (!data.parts || data.parts.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.textContent = "No parts found.";
    row.appendChild(cell);
    tbody.appendChild(row);
    updatePagination({ has_previous: false, has_next: false, current_page: 1, num_pages: 1 });
    return;
  }

  for (const part of data.parts) {
    const row = document.createElement("tr");

    if (part.failure === 'rejected') {
      row.classList.add('status-empty');
    } else if (part.failure === 'accepted') {
    } else {
      row.classList.add('status-tahvil');
    }

    row.innerHTML = `
      <td>${ part.code_anbar }</td>
      <td>${ part.part_number }</td>
      <td>${ part.order_number }</td>
      <td>${ part.failure }</td>
      <td>${ part.description }</td>
      <td>${ part.count }</td>
      <td>${ part.reserve }</td>
      <td>${ part.ordered }</td>
      <td>
        <button class="edit-btn" data-mode="edit" style="background: none; border: none; cursor: pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20" fill="currentColor" style="pointer-events: none;">
            <path d="M2 14.5V18h3.5L17 6.5l-3.5-3.5L2 14.5zM19.71 4.04a1.003 1.003 0 0 0 0-1.41L17.37.29a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.5 3.5 1.83-1.83z"/>
          </svg>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  }

  updatePagination(data);
}
  function updatePagination({ has_previous, has_next, current_page, num_pages }) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "12px";
    wrapper.style.padding = "6px 12px";
    wrapper.style.backgroundColor = "#eef6ff";
    wrapper.style.borderRadius = "8px";
    wrapper.style.border = "1px solid #c4d9f3";
    wrapper.style.fontSize = "0.9rem";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "⟨ Prev";
    prevBtn.disabled = !has_previous;
    prevBtn.style = buttonStyle(prevBtn.disabled);
    prevBtn.onclick = () => { if (has_previous) sendSearch(current_page - 1); };

    const pageInfo = document.createElement("div");
    pageInfo.textContent = `Page ${current_page} of ${num_pages}`;

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next ⟩";
    nextBtn.disabled = !has_next;
    nextBtn.style = buttonStyle(nextBtn.disabled);
    nextBtn.onclick = () => { if (has_next) sendSearch(current_page + 1); };

    wrapper.appendChild(prevBtn);
    wrapper.appendChild(pageInfo);
    wrapper.appendChild(nextBtn);
    paginationContainer.appendChild(wrapper);
  }

  function buttonStyle(disabled) {
    return `
      background: #d3e8ff;
      border: 1px solid #9ec6f5;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: ${disabled ? "default" : "pointer"};
      font-size: 0.85rem;
      opacity: ${disabled ? "0.4" : "1"};
    `;
  }
  const searchableFields = ["order_number", "part_number", "code_anbar"];
  const choosableFields = ["failure"]
  document.querySelectorAll("#resizable-table thead th").forEach(th => {
  const field = th.dataset.field;
  if (!field) return;

  if (searchableFields.includes(field)) {
    createInput(th, field);
  }else{if (choosableFields.includes(field)){
    createStatusFilter(th, field);
  }
  }
});

  sendSearch(1);
});