function addMaterialRow() {
            const table = document.querySelector("#resizable-table tbody");
            const row = document.createElement("tr");
        
            row.innerHTML = `
                <td>New</td>
                <td>
                    <input type="text" name="new_dimensions[]" placeholder="LxWxH or '-' if Scrap" class="green-inp" />
                </td>
                <td>
                    <input type="text" name="new_alloy[]" placeholder="Alloy" class="green-inp" />
                </td>
                <td>
                    <input type="text" name="new_order[]" placeholder="Order Name" class="green-inp" />
                </td>
                <td>
                    <select name="new_type[]" class="green-inp">
                        <option value="BILLET">Billet</option>
                        <option value="SHEET">Sheet</option>
                        <option value="SCRAP">Scrap</option>
                    </select>
                </td>
                <td>
                    empty
                </td>
                <td>
                    <button type="button" onclick="confirmRow(this)" style="background: #f5fdf8; border: none; cursor: pointer;">✔️</button>
                    <button type="button" onclick="cancelRow(this)" style="background: #f5fdf8; border: none; cursor: pointer;">❌</button>
                </td>
            `;
        
            table.appendChild(row);
        }
        
        function confirmRow(btn) {
            const row = btn.closest("tr");
            const type = row.querySelector('select').value;
            const dim = row.querySelector('input[name="new_dimensions[]"]').value.trim();
            const alloy = row.querySelector('input[name="new_alloy[]"]').value.trim();
            const order = row.querySelector('input[name="new_order[]"]').value.trim();
        
            if (!type || !alloy || !order || (!dim && type !== 'SCRAP')) {
                alert("Please fill in all fields.");
                return;
            }
        
            const dimParts = dim === '-' ? ['-'] : dim.split('x');
        
            if (type !== 'SCRAP' && dimParts.length !== 3) {
                alert("Dimensions must be in the format LxWxH.");
                return;
            }
        
            row.innerHTML = `
                <td>New</td>
                <td>${dim}<input type="hidden" name="new_dimensions[]" value="${dim}"></td>
                <td>${alloy}<input type="hidden" name="new_alloy[]" value="${alloy}"></td>
                <td>${order}<input type="hidden" name="new_order[]" value="${order}"></td>
                <td>${type}<input type="hidden" name="new_type[]" value="${type}"></td>
                <td> empty </td>
                <td>
                    <button type="button" onclick="cancelRow(this)" class="cancel">❌</button>
                </td>
            `;
        }
        
        function cancelRow(btn) {
            btn.closest("tr").remove();
        }
        function validateForm() {
    const typeFields = document.querySelectorAll('select[name="new_type[]"]');
    const dimensionFields = document.querySelectorAll('input[name="new_dimensions[]"]');
    const alloyFields = document.querySelectorAll('input[name="new_alloy[]"]');
    const orderFields = document.querySelectorAll('input[name="new_order[]"]');

    for (let i = 0; i < typeFields.length; i++) {
        const type = typeFields[i].value.trim();
        const dim = dimensionFields[i].value.trim();
        const alloy = alloyFields[i].value.trim();
        const order = orderFields[i].value.trim();

        if (!type || !alloy || !order || (!dim && type !== 'SCRAP')) {
            alert("Please fill in all material fields before saving.");
            return false;
        }

        const dimParts = dim === '-' ? ['-'] : dim.split('x');
        if (type !== 'SCRAP' && dimParts.length !== 3) {
            alert("Dimensions must be in the format LxWxH.");
            return false;
        }
    }

    return true;
}
document.addEventListener("DOMContentLoaded", () => {

    const tbody = document.querySelector("#resizable-table tbody");
    tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".edit-btn");
    if (!btn || !tbody.contains(btn)) return;

    const row = btn.closest("tr");
    if (row.dataset.editing === "true") return;
    row.dataset.editing = "true";

    const cells = row.querySelectorAll("td");
    const id = cells[0].textContent.trim();
    const dim = cells[1].textContent.trim();
    const alloy = cells[2].textContent.trim();
    const order = cells[3].textContent.trim();
    const type = cells[4].textContent.trim();
    const status = cells[5].textContent.trim();

    row.innerHTML = `
      <td>${id}</td>
      <td><input type="text" value="${dim}" /></td>
      <td><input type="text" value="${alloy}" /></td>
      <td><input type="text" value="${order}" /></td>
      <td>
        <select>
          <option value="BILLET" ${type==="BILLET"?"selected":""}>Billet</option>
          <option value="SHEET" ${type==="SHEET"?"selected":""}>Sheet</option>
          <option value="SCRAP" ${type==="SCRAP"?"selected":""}>Scrap</option>
        </select>
      </td>
      <td>${status}</td>
      <td>
        <button type="button" class="save-btn" style="background:#f5fdf8;border:none;cursor:pointer;">✔️</button>
        <button type="button" class="cancel-btn" style="background:#f5fdf8;border:none;cursor:pointer;">❌</button>
      </td>
    `;
  });

  tbody.addEventListener("click", (e) => {
    const row = e.target.closest("tr")
    if (!row) return;

    if (e.target.closest(".save-btn")) {
      const id = row.children[0].textContent.trim()
      const dim = row.children[1].firstChild.value.trim()
      const alloy = row.children[2].firstChild.value.trim()
      const order = row.children[3].firstChild.value.trim()
      const type = row.children[4].firstElementChild.value

      const baseUrl = window.location.pathname.replace(/\/$/, "")
      const editUrl = `${baseUrl}/edit/`

      fetch(editUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") 
        },
        body: JSON.stringify({ id, dim, alloy, order, type})
      })
      .then(res => {
        location.reload();
        alert("Material was editted")
      })
    }
    if (e.target.closest(".cancel-btn")) {
      location.reload();
    }

    function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  });

 

  const headerRow = document.getElementById("header-row");
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
    input.style.border = "1px solid #4caf50";       
    input.style.borderRadius = "4px";
    input.style.backgroundColor = "#e8f5e9";        
    input.style.color = "#1b5e20";                 
    input.style.textAlign = "center";

    input.value = currentFilters[field] || "";

    const reset = document.createElement("button");
    reset.textContent = "×";
    reset.style.fontSize = "0.85em";
    reset.style.padding = "2px 6px";
    reset.style.cursor = "pointer";
    reset.style.border = "1px solid #4caf50";      
    reset.style.backgroundColor = "#c8e6c9";        
    reset.style.color = "#2e7d32";          
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
  function createStatusFilter(th, field) {

    const wrapper = document.createElement("div");
    wrapper.className = "failure-filter";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.marginTop = "6px";
    wrapper.style.padding = "4px";
    wrapper.style.border = "1px solid #4caf50";       
    wrapper.style.backgroundColor = "#e8f5e9";        
    wrapper.style.color = "#1b5e20";   
    wrapper.style.borderRadius = "6px";

    const typeMap = {
      "Scrap": "SCRAP",
      "Billet": "BILLET",
      "Sheet": "SHEET",
    };
    const statusMap ={
        "empty":"EPT",
        "has part":"PRT",
        "separated":"SEP",
    }

    if (field ==="status"){
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
                currentFilters.status = checkedValues.join(",");
                sendSearch(1);
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(labelText));
            wrapper.appendChild(label);
        }
    }else{
        for (const [labelText, codeValue] of Object.entries(typeMap)) {
            const label = document.createElement("label");
            label.style.fontSize = "0.75em";
            label.style.marginBottom = "2px";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = codeValue;
            checkbox.style.marginRight = "4px";

            if (currentFilters.type && currentFilters.type.split(",").includes(codeValue)) {
                checkbox.checked = true;
            }

            checkbox.addEventListener("change", () => {
                const checkedValues = Array.from(wrapper.querySelectorAll("input[type=checkbox]:checked"))
                .map(cb => cb.value);
                currentFilters.type = checkedValues.join(",");
                sendSearch(1);
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(labelText));
            wrapper.appendChild(label);
        }
    }

    th.appendChild(wrapper);
  }

  function updateTable(data) {
  const tbody = document.querySelector("#resizable-table tbody");
  tbody.innerHTML = "";

  if (!data.mats || data.mats.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.textContent = "No Materials found.";
    row.appendChild(cell);
    tbody.appendChild(row);
    updatePagination({ has_previous: false, has_next: false, current_page: 1, num_pages: 1 });
    return;
  }

  for (const mat of data.mats) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${ mat.id }</td>
      <td>${ mat.dimension }</td>
      <td>${ mat.alloy }</td>
      <td>${ mat.order }</td>
      <td>${ mat.type }</td>
      <td>${ mat.status }</td>
      <td>
        <button type="button" class="edit-btn" data-mode="edit" style="background: none; border: none; cursor: pointer;">
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
    wrapper.style.backgroundColor = "#f0f9f0";     // light green background
    wrapper.style.borderRadius = "8px";
    wrapper.style.border = "1px solid #b3e6b3";    // soft green border
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
        background: #d6f5d6;                /* soft green button background */
        border: 1px solid #66cc66;          /* medium green border */
        padding: 4px 10px;
        border-radius: 6px;
        cursor: ${disabled ? "default" : "pointer"};
        font-size: 0.85rem;
        opacity: ${disabled ? "0.4" : "1"};
    `;
    }
  const searchableFields = ["alloy", "order"];
  const choosableFields = ["type", "status"]
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