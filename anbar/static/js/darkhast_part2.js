document.addEventListener("DOMContentLoaded", () => {
            const selectedParts = new Map();
        
            function addPartRow(part) {
                if (selectedParts.has(part.codeanbar)) return;
        
                const tbody = document.querySelector("#selected-parts tbody");
                const row = document.createElement("tr");
        
                row.innerHTML = `
                    <td>${part.project}</td>
                    <td>${part.boardname}</td>
                    <td>${part.designator}</td>
                    <td>${part.partnumber}</td>
                    <td>${part.codeanbar}</td>
                    <td>${part.ordernumber}</td>
                    <td>${part.inventory}</td>
                    <td>
                        <input type="number" name="quantity_${part.codeanbar}" min="1" required style="width: 60px;">
                    </td>
                    <td>
                        <button type="button" class="remove-part" data-id="${part.codeanbar}" style="background: none; border: none; cursor: pointer;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" style="pointer-events: none;">
                                <path d="M5 12h14" stroke="red" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
                    
                selectedParts.set(part.codeanbar, part);
        
                const hidden = document.createElement("input");
                hidden.type = "hidden";
                hidden.name = "selected_parts";
                hidden.value = part.codeanbar;
                hidden.dataset.partId = part.codeanbar;
                document.querySelector("form").appendChild(hidden);
            }
        
            document.addEventListener("click", (e) => {
                if (e.target.classList.contains("add-part-btn")) {
                    const row = e.target.closest("tr");
                    const part = {
                        project: row.cells[0].textContent,
                        boardname: row.cells[1].textContent,
                        designator: row.cells[2].textContent,
                        partnumber: row.cells[3].textContent,
                        codeanbar: row.cells[4].textContent,
                        ordernumber: row.cells[5].textContent,
                        inventory: row.cells[6].textContent,
                    };
                    addPartRow(part);
                }
        
                if (e.target.classList.contains("remove-part")) {
                    const id = e.target.dataset.id;
                    selectedParts.delete(id);
                    e.target.closest("tr").remove();
                    const hiddenInput = document.querySelector(`input[type="hidden"][data-part-id="${id}"]`);
                    if (hiddenInput) hiddenInput.remove();
                }
            });
        
            const headerRow = document.getElementById("header-row");
            const currentFilters = {};
            let currentPage = 1;
        
            const debounce = (func, delay = 400) => {
                let timer;
                return (...args) => {
                    clearTimeout(timer);
                    timer = setTimeout(() => func(...args), delay);
                };
            };
        
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
        
            function updateTable(data) {
                const tbody = document.querySelector("#resizable-table tbody");
                tbody.innerHTML = "";
        
                if (!data.boards || data.boards.length === 0) {
                    const row = document.createElement("tr");
                    const cell = document.createElement("td");
                    cell.colSpan = 8;
                    cell.textContent = "No boards found.";
                    row.appendChild(cell);
                    tbody.appendChild(row);
                    updatePagination({ has_previous: false, has_next: false, current_page: 1, num_pages: 1 });
                    return;
                }
        
                for (const board of data.boards) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${board.project}</td>
                        <td>E${board.boardid}V${board.version}(${board.title})</td>
                        <td><div title="${board.designator}">${board.designator}</div></td>
                        <td>${board.part_number}</td>
                        <td>${board.code_anbar}</td>
                        <td>${board.ordernumber}</td>
                        <td>${board.count}</td>
                        <td><button type="button" class="add-part-btn" style="background: none; border: none; cursor: pointer;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" style="pointer-events: none;">
                                    <path d="M12 5v14M5 12h14" stroke="green" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
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
                input.style.width = "50px";
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
                reset.style.padding = "2px 3px";
                reset.style.cursor = "pointer";
                reset.style.border = "1px solid #9ec6f5";
                reset.style.backgroundColor = "#d9ecff";
                reset.style.color = "#004080";
                reset.type = "button"
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
        
            document.querySelectorAll("#resizable-table thead th").forEach(th => {
                const field = th.dataset.field;
                if (!field) return;
        
                const searchableFields = ["boardname", "project", "designator", "partnumber", "codeanbar", "ordernumber"];
                if (searchableFields.includes(field)) {
                    createInput(th, field);
                }
            });
        
            sendSearch(1);
        });