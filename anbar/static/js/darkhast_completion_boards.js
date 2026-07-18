function handleSubmit(e){
        const userSelect = document.querySelector('#user-select')
        const checkedRows = [...document.querySelectorAll("tbody tr")].filter(row => {
          const lastTd = row.querySelector("td:last-child")
          const checkbox = lastTd.querySelector("input[type='checkbox']")
          return checkbox.checked
        })
        console.log(selectedBoards.size)
        if (selectedBoards.size === 0){
          alert('Please select a board!!!')
          return false
        }
        for (const row of checkedRows) {
          const td = row.children[4]
          if (td.textContent.trim() === "0") {
            alert('There is a uncompletable board in your selected boards!!!')
            return false
          }
        }
        if (userSelect.value === 'Select Assembler'){
          alert('Please select an assembler !!!')
          return false
        }
        const form = e.target;
        selectedBoards.forEach(id => {
          const hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = 'selected_boards_hidden';
          hidden.value = id;
          form.appendChild(hidden);
        })
      }
      const selectedBoards = new Set()

  document.addEventListener("DOMContentLoaded", () => {
  
    

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
      if (value) params.set(field, value);
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
    reset.type = 'reset';
    reset.style.fontSize = "0.85em";
    reset.style.padding = "2px 6px";
    reset.style.cursor = "pointer";
    reset.style.border = "1px solid #9ec6f5";
    reset.style.backgroundColor = "#d9ecff";
    reset.style.color = "#004080";
    reset.style.borderRadius = "4px";

    input.addEventListener("input", debounce(() => {
      currentFilters[field] = input.value.trim();
      sendSearch();
    }));

    reset.addEventListener("click", () => {
      input.value = "";
      currentFilters[field] = "";
      sendSearch();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(reset);
    th.appendChild(wrapper);
  }

  document.querySelectorAll("#resizable-table thead th").forEach(th => {
    const field = th.dataset.field;
    if (!field) return;
    if (field === "version" || field === "serial") {
      createInput(th, field);
    } 
  });

  document.addEventListener("change", (e) => {
    if (e.target.matches("input[name='selected_boards']")) {
      const id = e.target.value;
      if (e.target.checked) selectedBoards.add(id);
      else selectedBoards.delete(id);
    }
  });

  function updateTable(data) {
    const tbody = document.querySelector("#resizable-table tbody");
    tbody.innerHTML = "";

    if (!data.boards || data.boards.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="8">No boards found.</td>`;
      tbody.appendChild(row);
      updatePagination({ has_previous: false, has_next: false, current_page: 1, num_pages: 1 });
      return;
    }

    for (const board of data.boards) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${board.project}</td>
        <td>${board.title}</td>
        <td class="serial-cell" colspan="3">
          <a href="/anbar/board_all/${board.project}/${board.title}/${board.title}/${board.id}" class="part-link" style="text-decoration: none;">
            ${board.part_number}
          </a>
        </td>
        <td>${board.eptboms}</td>
        <td>${board.cmplt}</td>
        <td>
          <input type="checkbox" name="selected_boards" value="${board.id}" ${selectedBoards.has(board.id.toString()) ? 'checked' : ''}>
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

  sendSearch(1);

});