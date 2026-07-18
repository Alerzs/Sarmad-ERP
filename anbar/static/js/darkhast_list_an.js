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

        function createStatusFilter(th, isStatus) {
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
            "Accepted": "ACC",
            "Rejected": "REJ",
            "Pending": "PND",
            }
            const typeMap = {
                "Assemble": "ASS",
                "Completion": "COM",
            }
            let mapp
            if (isStatus) 
            {
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
            }
            else{
                for (const [labelText, codeValue] of Object.entries(typeMap)) {
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

        if (!data.darkhasts || data.darkhasts.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 8;
            cell.textContent = "No request found.";
            row.appendChild(cell);
            tbody.appendChild(row);
            updatePagination({ has_previous: false, has_next: false, current_page: 1, num_pages: 1 });
            return;
        }

        for (const req of data.darkhasts) {
            const row = document.createElement("tr");

            row.innerHTML = `
            <td><a href=${ req.req_id } class="part-link" style="text-decoration: none;">${ req.req_id }</a></td>
            <td>${ req.sender }</td>
            <td>${ req.board }</td>
            <td>${ req.assembler }</td>
            <td>${ req.type }</td>
            <td>${ req.status }</td>
            <td>
                <form action="/anbar/export_excel/${req.req_id}" method="get">
                    <button type="submit">Export</button>
                </form>
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
        const choosableFields = ["status"]
        document.querySelectorAll("#resizable-table thead th").forEach(th => {
        const field = th.dataset.field;
        if (!field) return;
        if (field === 'status'){
            createStatusFilter(th, true);
        }
        if (field === 'type'){
            createStatusFilter(th, false);
        }
        })

        sendSearch(1)
        })