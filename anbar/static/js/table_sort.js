document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById("resizable-table");
    const headers = table.querySelectorAll("th");
    const sortStates = {};

    headers.forEach((header, columnIndex) => {
        header.addEventListener("click", () => {
            const tbody = table.tBodies[0];
            const rows = Array.from(tbody.rows);

            const key = columnIndex;
            const currentDirection = sortStates[key] || "asc";
            const newDirection = currentDirection === "asc" ? "desc" : "asc";
            sortStates[key] = newDirection;

            const isNumeric = val => /^-?\d+(\.\d+)?$/.test(val);

            rows.sort((a, b) => {
                const aText = a.cells[columnIndex].innerText.trim();
                const bText = b.cells[columnIndex].innerText.trim();

                console.log(`Column ${columnIndex} | A: "${aText}", B: "${bText}"`);

                const aVal = isNumeric(aText) ? parseFloat(aText) : aText.toLowerCase();
                const bVal = isNumeric(bText) ? parseFloat(bText) : bText.toLowerCase();

                if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
                if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
                return 0;
            });

            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }
            rows.forEach(row => tbody.appendChild(row));

            // Visual direction indicator
            headers.forEach(h => h.classList.remove("asc", "desc"));
            header.classList.add(newDirection);
        });
    });
});