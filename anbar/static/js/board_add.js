function toggleSelectAllSerials(selectAllCheckbox) {
    const checkboxes = document.querySelectorAll('.serial-checkbox');
    checkboxes.forEach(function (checkbox) {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

function limitInputToFourDigits(input) {
    input.value = input.value.slice(0, 4);
}

function generateRangeOptions() {
    const start = parseInt(document.getElementById('rangeStart').value);
    const end = parseInt(document.getElementById('rangeEnd').value);
    const rangePanel = document.getElementById('rangeOptionsPanel');
    rangePanel.innerHTML = '';

    if (isNaN(start) || isNaN(end)) {
        alert('Please enter valid numbers for start and end.');
        return;
    }
    if (start > end) {
        alert('Start must be less than or equal to End.');
        return;
    }
    if ((end - start) >= 100) {
        alert('The difference between End and Start must be less than 100.');
        return;
    }

    const selectAllLabel = document.createElement('label');
    selectAllLabel.innerHTML = `
        <input type="checkbox" id="selectAllSerials" onclick="toggleSelectAllSerials(this)"> Select All
    `;
    rangePanel.appendChild(selectAllLabel);
    rangePanel.appendChild(document.createElement('br'));

    for (let i = start; i <= end; i++) {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" name="range_options" value="${i}" class="serial-checkbox"> ${i}
        `;
        rangePanel.appendChild(label);
        rangePanel.appendChild(document.createElement('br'));
    }

    document.getElementById('rangeOptionsPanel').classList.add('active');
}

function togglePanel(id) {
    const panel = document.getElementById(id);
    panel.classList.toggle('active');
}

function updateBoardsByProject(projectId) {
    const namePanel = document.getElementById('namePanel');
    const boardPanel = document.getElementById('boardPanel');
    namePanel.innerHTML = '';
    boardPanel.innerHTML = '';

    const filteredBoards = allBoards.filter(b => b.project_id == projectId);
    const titles = [...new Set(filteredBoards.map(b => b.title))];

    titles.forEach(title => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="radio" name="board_title" value="${title}" onchange="updateBoardIDs('${title}', ${projectId})">
            ${title}
        `;
        namePanel.appendChild(label);
        namePanel.appendChild(document.createElement('br'));
    });
}

function updateBoardIDs(title, projectId) {
    const boardPanel = document.getElementById('boardPanel');
    boardPanel.innerHTML = '';

    const boards = allBoards.filter(b => b.title === title && b.project_id == projectId);
    boards.forEach(board => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="radio" name="board" value="${board.id}">
            ${board.version}
        `;
        boardPanel.appendChild(label);
        boardPanel.appendChild(document.createElement('br'));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const boardsDataEl = document.getElementById('boards-data');
    if (boardsDataEl) {
        window.allBoards = JSON.parse(boardsDataEl.textContent);
    }

    const rangeStart = document.getElementById('rangeStart');
    const rangeEnd = document.getElementById('rangeEnd');

    if (rangeStart) {
        rangeStart.addEventListener('input', function () {
            limitInputToFourDigits(this);
        });
    }
    if (rangeEnd) {
        rangeEnd.addEventListener('input', function () {
            limitInputToFourDigits(this);
        });
    }

    document.querySelectorAll("input[name='project']").forEach(radio => {
        radio.addEventListener('change', function () {
            updateBoardsByProject(this.value);
        });
    });
});