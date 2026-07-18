function editRow(button) {
        const allEditButtons = document.querySelectorAll('.edit-btn');
        allEditButtons.forEach((btn) => {
            btn.disabled = true;
        });
        const row = button.closest('tr');
        const cells = row.querySelectorAll('.editable');
        const selects = row.querySelector('.selectable');
        const orderId = row.getAttribute('data-id');

        cells.forEach((cell) => {
            let currentValue = cell.textContent.trim();
            const fieldName = cell.getAttribute('data-field');

            if (fieldName.includes('date')) {
                let isoDate = toISODate(currentValue);
                cell.innerHTML = `<input style="width:100px;" type="date" name="${fieldName}" value="${isoDate}">`;
            } else {
                cell.innerHTML = `<input style="width:80px;" type="text" name="${fieldName}" value="${currentValue === "None" ? "" : currentValue}">`;
            }
        });

        let currentOption = selects.textContent.trim();
        const fieldName = selects.getAttribute('data-field');
        selects.innerHTML = `
            <label for="pre">PreOrder</label>
            <input type="radio" id="pre" name="${fieldName}" value="PRE" ${currentOption === 'PreOrder' ? 'checked' : ''}><br>
            <label for="ord">Ordered</label>
            <input type="radio" name="${fieldName}" value="ORD" ${currentOption === 'Ordered' ? 'checked' : ''}><br>
            <label for="rcv">Received</label>
            <input type="radio" name="${fieldName}" value="RCV" ${currentOption === 'Received' ? 'checked' : ''}>
        `;

        function toISODate(dateStr) {
            if (!dateStr || dateStr === "None") return "";
            const parsed = new Date(dateStr);
            if (isNaN(parsed)) return "";
            return parsed.toISOString().split("T")[0];
        }

        button.style.display = 'none';
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '✔️';
        saveBtn.style.border = 'none';
        saveBtn.style.background = 'none';
        saveBtn.style.cursor = 'pointer';
        saveBtn.onclick = function() { saveChanges(row, orderId) };

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '❌';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'none';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = function() { cancelEdit(row, button) };

        row.querySelector('td:nth-child(10)').appendChild(saveBtn);
        row.querySelector('td:nth-child(10)').appendChild(closeBtn);
    }
    function saveChanges(row, orderId) {
        const inputs = row.querySelectorAll('input');
        const updatedData = { "orderId": orderId };

        inputs.forEach(function(input) {
            updatedData[input.name] = input.value;
        });

        fetch('/finance/orders/', {
            method: 'POST',
            body: JSON.stringify(updatedData),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            }
        })
        .then(window.location.reload());
    }
    function cancelEdit(row, editButton) {
        window.location.reload();
    }
    document.addEventListener('DOMContentLoaded', function() {
        
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
            input.style.border = "1px solid #ffb366";   
            input.style.borderRadius = "4px";
            input.style.backgroundColor = "#fff4e6";      
            input.style.color = "#663300";          
            input.style.textAlign = "center";

            input.value = currentFilters[field] || "";

            const reset = document.createElement("button");
            reset.textContent = "×";
            reset.style.fontSize = "0.85em";
            reset.style.padding = "2px 6px";
            reset.style.cursor = "pointer";
            reset.style.border = "1px solid #ffb366";    
            reset.style.backgroundColor = "#ffe0b3";      
            reset.style.color = "#663300";              
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
            wrapper.style.backgroundColor = "#fff4e6";
            wrapper.style.border = "1px solid #ffb366"; 
            wrapper.style.borderRadius = "6px";

            const statusMap = {
            "PreOrder": "PRE",
            "Ordered": "ORD",
            "Received": "RCV",
            }

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
            cell.textContent = "No Order found.";
            row.appendChild(cell);
            tbody.appendChild(row);
            updatePagination({ has_previous: false, has_next: false, current_page: 1, num_pages: 1 });
            return;
        }

        for (const part of data.parts) {
            const row = document.createElement("tr")
            row.dataset.id = part.pk
            row.innerHTML = `
            <td><a href=${ part.pk } class="part-link" style="text-decoration: none;">${ part.order_number }</a></td>
            <td class="selectable" data-field="status" style="width:100px">${ part.status }</td>
            <td class="editable" data-field="vendor">${ part.vendor }</td>
            <td class="editable" data-field="track_number">${ part.track_number }</td>
            <td>${ part.order_date }</td>
            <td class="editable" data-field="peyment_date">${ part.peyment_date }</td>
            <td class="editable" data-field="arrive_date">${ part.arrive_date }</td>
            <td class="editable" data-field="supply_date">${ part.supply_date }</td>
            <td class="editable" data-field="resupply_date">${ part.resupply_date }</td>
            <td>
                <button class="edit-btn" onclick="editRow(this)" style="background: none; border: none; cursor: pointer;" aria-label="Edit Order">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20" fill="currentColor" style="pointer-events: none;">
                        <path d="M2 14.5V18h3.5L17 6.5l-3.5-3.5L2 14.5zM19.71 4.04a1.003 1.003 0 0 0 0-1.41L17.37.29a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.5 3.5 1.83-1.83z"/>
                    </svg>
                </button>
            </td>
            <td style="width: 50px;">
                <form action="/finance/delete-order/{{order.pk}}" onsubmit="return confirmSubmit('{{order.order_number}}', '{{order.status}}')">
                    <button class="delete-btn" style="background: none; border: none; cursor: pointer;" aria-label="Delete Order">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 448 512" fill="currentColor" style="pointer-events: none;">
                            <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                        </svg>
                    </button>
                </form>
            </td>
            `
            tbody.appendChild(row);
        }

        updatePagination(data);
        }
        function updatePagination({ has_previous, has_next, current_page, num_pages }) {
            const paginationContainer = document.getElementById("pagination");
            paginationContainer.innerHTML = "";

            const wrapper = document.createElement("div")
            wrapper.style.display = "inline-flex"
            wrapper.style.alignItems = "center"
            wrapper.style.gap = "12px"
            wrapper.style.padding = "6px 12px"
            wrapper.style.backgroundColor = "#fff4e6"
            wrapper.style.borderRadius = "8px"
            wrapper.style.border = "1px solid #ffc69e"
            wrapper.style.fontSize = "0.9rem"

            const prevBtn = document.createElement("button")
            prevBtn.textContent = "⟨ Prev"
            prevBtn.disabled = !has_previous
            prevBtn.style = buttonStyle(prevBtn.disabled)
            prevBtn.onclick = () => { if (has_previous) sendSearch(current_page - 1); }

            const pageInfo = document.createElement("div")
            pageInfo.textContent = `Page ${current_page} of ${num_pages}`

            const nextBtn = document.createElement("button")
            nextBtn.textContent = "Next ⟩"
            nextBtn.disabled = !has_next
            nextBtn.style = buttonStyle(nextBtn.disabled)
            nextBtn.onclick = () => { if (has_next) sendSearch(current_page + 1); }

            wrapper.appendChild(prevBtn)
            wrapper.appendChild(pageInfo)
            wrapper.appendChild(nextBtn)
            paginationContainer.appendChild(wrapper)
            }
            function buttonStyle(disabled) {
                return `
                background: #ffe0b3;  // was #d3e8ff
                border: 1px solid #ffb366; // was #9ec6f5
                padding: 4px 10px;
                border-radius: 6px;
                cursor: ${disabled ? "default" : "pointer"};
                font-size: 0.85rem;
                opacity: ${disabled ? "0.4" : "1"};
                `;
            }
        const searchableFields = ["order_number", "vendor", "track_number"]
        const choosableFields = ["status"]
        document.querySelectorAll("#resizable-table thead th").forEach(th => {
        const field = th.dataset.field
        if (!field) return

        if (searchableFields.includes(field)) {
            createInput(th, field)
        }else{if (choosableFields.includes(field)){
            createStatusFilter(th, field)
        }
        }
        })

        sendSearch(1)
    })