function toggleDetails(index) {
    const row = document.getElementById('details-' + index);
    row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
}

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

        let index = (data.current_page - 1) * data.page_size + 1;
        for (const board of data.boards) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index}</td>
                <td>${board.project}</td>
                <td>${board.title}</td>
                <td>
                    <a href="${board.title}/${board.id}" class="part-link">${board.part_number}</a>
                </td>
                <td>${board.status}</td>
                <td>${board.req}</td>
            `;
            tbody.appendChild(row);
            index++;
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

    sendSearch(1);
});