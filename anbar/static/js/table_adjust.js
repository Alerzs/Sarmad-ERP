document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById("resizable-table");
    if (!table) return;

    const cols = table.querySelectorAll("th");
    let startX, startWidth, resizer;

    cols.forEach(col => {
        resizer = document.createElement("div");
        resizer.style.width = "5px";
        resizer.style.height = "100%";
        resizer.style.position = "absolute";
        resizer.style.right = "0";
        resizer.style.top = "0";
        resizer.style.cursor = "col-resize";
        resizer.addEventListener("mousedown", initResize);

        col.style.position = "relative";
        col.appendChild(resizer);
    });

    function initResize(e) {
        startX = e.clientX;
        startWidth = e.target.parentElement.offsetWidth;
        resizer = e.target;
        document.addEventListener("mousemove", doResize);
        document.addEventListener("mouseup", stopResize);
    }

    function doResize(e) {
        const newWidth = startWidth + (e.clientX - startX);
        resizer.parentElement.style.width = newWidth + "px";
    }

    function stopResize() {
        document.removeEventListener("mousemove", doResize);
        document.removeEventListener("mouseup", stopResize);
    }
});
