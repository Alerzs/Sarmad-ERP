document.addEventListener('DOMContentLoaded', () => {
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
        params.set('page', page);

        fetch(`?${params.toString()}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(res => res.json())
            .then(updateTable);
    }

    function createInput(th, field) {
        if (th.querySelector('.search-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'search-wrapper';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search...';
        input.value = currentFilters[field] || '';

        const reset = document.createElement('button');
        reset.textContent = '×';

        input.addEventListener('input', debounce(() => {
            currentFilters[field] = input.value.trim();
            sendSearch(1);
        }));

        reset.addEventListener('click', () => {
            input.value = '';
            currentFilters[field] = '';
            sendSearch(1);
        });

        wrapper.appendChild(input);
        wrapper.appendChild(reset);
        th.appendChild(wrapper);
        input.focus();
    }

    function updateTable(data) {
        const tbody = document.querySelector('#resizable-table tbody');
        tbody.innerHTML = '';

        if (!data.boards || data.boards.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 2;
            cell.textContent = 'No boards found.';
            row.appendChild(cell);
            tbody.appendChild(row);
            updatePagination({ has_previous: false, has_next: false, current_page: 1, num_pages: 1 });
            return;
        }

        for (const board of data.boards) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${board.project}</td>
                <td><a href="${board.project}/${board.title}">${board.title} - E${board.name}</a></td>
            `;
            tbody.appendChild(row);
        }

        updatePagination(data);
    }

    function updatePagination({ has_previous, has_next, current_page, num_pages }) {
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'pagination-controls';

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '⟨ Prev';
        prevBtn.disabled = !has_previous;
        prevBtn.className = 'pagination-btn';
        prevBtn.onclick = () => { if (has_previous) sendSearch(current_page - 1); };

        const pageInfo = document.createElement('div');
        pageInfo.textContent = `Page ${current_page} of ${num_pages}`;

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next ⟩';
        nextBtn.disabled = !has_next;
        nextBtn.className = 'pagination-btn';
        nextBtn.onclick = () => { if (has_next) sendSearch(current_page + 1); };

        wrapper.appendChild(prevBtn);
        wrapper.appendChild(pageInfo);
        wrapper.appendChild(nextBtn);
        paginationContainer.appendChild(wrapper);
    }

    document.querySelectorAll('#resizable-table thead th').forEach(th => {
        const field = th.dataset.field;
        createInput(th, field);
    });

    sendSearch(1);
});