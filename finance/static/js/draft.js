const orderPartsID = []

        function sendData(e){
            const form = e.target.closest('form')
            const paletIDs = form.querySelector('#paletids')
            paletIDs.value = orderPartsID
            const orderName = form.querySelector('#ordername') 
            if (!orderName.value){
                return alert('please fill the Order Name!!!')
            }
            form.submit()
            }
        document.addEventListener('DOMContentLoaded', function() {
            const table = document.getElementById('resizable-table');
            const secondTable = document.querySelector('.second-table')
            

            secondTable.addEventListener('click',(e) => {
                const target = e.target.closest('button');
                if (!target) return

                const row = target.closest('tr')
                const rowId = row.dataset.id
                if (target.classList.contains('remove')){
                    orderPartsID.splice(orderPartsID.indexOf(rowId), 1)
                    row.remove()
                    if (orderPartsID.length === 0){
                        secondTable.classList.add('deactive')
                    }
                }
            })

            table.addEventListener('click', function(e) {
                const target = e.target.closest('button');
                if (!target) return;

                const row = target.closest('tr')
                const rowId = row.dataset.id
                
                if (target.classList.contains('add-btn')){
                    secondTable.classList.remove('deactive')
                    if (!orderPartsID.includes(rowId)) {
                        const tableBody = secondTable.querySelector('table tbody')
                        const partNumber = document.createElement('td')
                        partNumber.textContent = row.children[0].textContent
                        const quantity = document.createElement('td')
                        quantity.textContent = row.children[2].textContent
                        const project = document.createElement('td')
                        project.textContent = row.children[5].textContent
                        const remove = document.createElement('td')
                        const removebtn = document.createElement('button')
                        removebtn.classList.add('remove')
                        removebtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" style="pointer-events: none;">
                            <path d="M5 12h14" stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        `
                        removebtn.style.background = 'none'
                        removebtn.style.border = 'none'
                        removebtn.style.cursor = 'pointer'
                        const newRow = document.createElement('tr')
                        newRow.dataset.id = rowId
                        remove.appendChild(removebtn)
                        newRow.append(partNumber, quantity, project, remove)
                        tableBody.appendChild(newRow)
                        orderPartsID.push(rowId)
                    }
                }

                if (target.classList.contains('edit-btn')) {
                    const quantityCell = row.children[2]
                    const statusCell = row.children[1]
                    const descriptionCell= row.children[6]
                    const originalQuantity = quantityCell.innerText
                    const originalStatus = statusCell.innerText
                    const originaldescription = descriptionCell.innerText
        
                    quantityCell.innerHTML = `<input type="number" min=1 value="${originalQuantity}" style="width: 60px;">`;
                    descriptionCell.innerHTML = `<input type="text" value="${originaldescription}" style="width: 100px;">`;
        
                    const statuses = { 'AC':'Accepted', 'RJ':'Rejected', 'NA':'Not Available', 'CN':'Conditional', 'ND':'Not Determined' };
                    let radios = '';
                    for (let key in statuses) {
                        const checked = statuses[key] === originalStatus ? 'checked' : '';
                        radios += `<label><input type="radio" name="status-${rowId}" value="${key}" ${checked}> ${statuses[key]}</label><br> `;
                    }
                    statusCell.innerHTML = radios;
                    target.parentElement.innerHTML = `
                        <button class="save-btn">Save</button>
                        <button class="cancel-btn">Cancel</button>
                    `;
                }
        
                if (target.classList.contains('cancel-btn')) {
                    const quantityCell = row.children[2];
                    const statusCell = row.children[1];
                    quantityCell.innerText = quantityCell.querySelector('input')?.defaultValue || quantityCell.innerText;
                    const radios = statusCell.querySelectorAll('input[type="radio"]');
                    radios.forEach(r => {
                        if (r.defaultChecked) {
                            statusCell.innerText = r.parentElement.innerText.trim();
                        }
                    });
                    target.parentElement.innerHTML = `
                        <button class="edit-btn" style="background: none; border: none; cursor: pointer;">
                            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20" fill="currentColor" style="pointer-events: none;">
                                <path d="M2 14.5V18h3.5L17 6.5l-3.5-3.5L2 14.5zM19.71 4.04a1.003 1.003 0 0 0 0-1.41L17.37.29a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.5 3.5 1.83-1.83z"/>
                            </svg>
                        </button>
                    `;
                }
                if (target.classList.contains('save-btn')) {
                    const quantityCell = row.children[2]
                    const statusCell = row.children[1]
                    const descriptionCell = row.children[6]
                    const description = descriptionCell.querySelector('input').value
                    const quantity = quantityCell.querySelector('input').value
                    const status = statusCell.querySelector(`input[name="status-${rowId}"]:checked`).value

                    fetch(`/finance/update-part/${rowId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': '{{ csrf_token }}'
                        },
                        body: JSON.stringify({ quantity, status, description })
                    })
                    .then(response => {
                        if (!response.ok) throw new Error('Network error');
                        return response.json();
                    })
                    .then(data => {
                        window.location.reload();
                    })
                    .catch(err => alert('Error saving data: ' + err));
                }
            });

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
            "Accepted": "AC",
            "Rejected": "RJ",
            "Conditional": "CN",
            "Not Available": "NA",
            "Not Determined": "ND"
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
            row.dataset.id = part.pk;
            if (part.status === 'Rejected') {
            row.classList.add('status-rj');
            } else if (part.status === 'Accepted') {
            row.classList.add('status-ac');
            } else if (part.status === 'Conditional') {
            row.classList.add('status-cn');
            }else if (part.status === 'Not Available') {
            row.classList.add('status-na');
            }
            row.innerHTML = `
            <td>${ part.part_number }</td>
            <td>${ part.status }</td>
            <td>${ part.quantity }</td>
            <td>${ part.board || '-' }</td>
            <td>${ part.sets || '-' }</td>
            <td>${ part.project || '-' }</td>
            <td>${ part.description || '-'}</td>
            <td>
                <button class="edit-btn" data-mode="edit" style="background: none; border: none; cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20" fill="currentColor" style="pointer-events: none;">
                    <path d="M2 14.5V18h3.5L17 6.5l-3.5-3.5L2 14.5zM19.71 4.04a1.003 1.003 0 0 0 0-1.41L17.37.29a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.5 3.5 1.83-1.83z"/>
                </svg>
                </button>
            </td>
            <td>
                <button type="button" style="background: none; border: none; cursor: pointer;" class="add-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" style="pointer-events: none;">
                        <path d="M12 5v14M5 12h14" stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
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
        const searchableFields = ["board", "part_number", "project"]
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

    })