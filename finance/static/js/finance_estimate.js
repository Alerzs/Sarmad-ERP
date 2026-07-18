function toggleSelectAll(selectAllCheckbox) {
        const checkboxes = document.querySelectorAll('.order-checkbox');
        checkboxes.forEach(function(checkbox) {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }
        function togglePanel(id) {
            const panel = document.getElementById(id);
            panel.classList.toggle('active');
        }

        function updateBoardsByProject(projectId) {
            const namePanel = document.getElementById("namePanel");
            const boardPanel = document.getElementById("boardPanel");
            namePanel.innerHTML = '';
            boardPanel.innerHTML = '';

            const filteredBoards = allBoards.filter(b => b.project_id == projectId);
            const titles = [...new Set(filteredBoards.map(b => b.title))];

            titles.forEach(title => {
                const label = document.createElement("label");
                label.innerHTML = `
                    <input type="radio" name="board_title" value="${title}" onchange="updateBoardIDs('${title}', ${projectId})">
                    ${title}
                `;
                namePanel.appendChild(label);
                namePanel.appendChild(document.createElement("br"));
            });
        }

        function updateBoardIDs(title, projectId) {
            const boardPanel = document.getElementById("boardPanel");
            boardPanel.innerHTML = '';

            const boards = allBoards.filter(b => b.title === title && b.project_id == projectId);

            boards.forEach(board => {
                const label = document.createElement("label");
                label.innerHTML = `
                    <input type="radio" name="board" value="${board.id}">
                    V${board.version}
                `;
                boardPanel.appendChild(label);
                boardPanel.appendChild(document.createElement("br"));
            });
        }

        document.querySelectorAll("input[name='project']").forEach(radio => {
            radio.addEventListener("change", function() {
                updateBoardsByProject(this.value);
            });
        });