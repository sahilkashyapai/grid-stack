// 🔥 INIT GRID
const grid = GridStack.init({
    column: 9,
    margin: 5,
    float: false // 👈 IMPORTANT (prevents shifting)
});

//  DEFAULT LAYOUT 
const defaultLayout = [

    // for 4X4 grid
    // Row 1
    // { x: 0, y: 0, w: 4, h: 1, content: '1' },
    // { x: 4, y: 0, w: 4, h: 1, content: '2' },
    // { x: 8, y: 0, w: 4, h: 1, content: '3' },
    // { x: 12, y: 0, w: 4, h: 1, content: '4' },

    // // Row 2
    // { x: 0, y: 1, w: 4, h: 1, content: '5' },
    // { x: 4, y: 1, w: 4, h: 1, content: '6' },
    // { x: 8, y: 1, w: 4, h: 1, content: '7' },
    // { x: 12, y: 1, w: 4, h: 1, content: '8' },

    // // Row 3
    // { x: 0, y: 2, w: 4, h: 1, content: '9' },
    // { x: 4, y: 2, w: 4, h: 1, content: '10' },
    // { x: 8, y: 2, w: 4, h: 1, content: '11' },
    // { x: 12, y: 2, w: 4, h: 1, content: '12' },

    // // Row 4
    // { x: 0, y: 3, w: 4, h: 1, content: '13' },
    // { x: 4, y: 3, w: 4, h: 1, content: '14' },
    // { x: 8, y: 3, w: 4, h: 1, content: '15' },
    // { x: 12, y: 3, w: 4, h: 1, content: '16' }



    // for 3X3 grid
    { x: 0, y: 0, w: 3, h: 1, content: '1' },
    { x: 3, y: 0, w: 3, h: 1, content: '2' },
    { x: 6, y: 0, w: 3, h: 1, content: '3' },

    // Row 2
    { x: 0, y: 1, w: 3, h: 1, content: '4' },
    { x: 3, y: 1, w: 3, h: 1, content: '5' },
    { x: 6, y: 1, w: 3, h: 1, content: '6' },

    // Row 3
    { x: 0, y: 2, w: 3, h: 1, content: '7' },
    { x: 3, y: 2, w: 3, h: 1, content: '8' },
    { x: 6, y: 2, w: 3, h: 1, content: '9' },


];

//  HISTORY (UNDO) 
let historyStack = [];

function saveState() {
    historyStack.push(JSON.stringify(grid.save()));
    if (historyStack.length > 20) historyStack.shift();
}

function undo() {
    if (!historyStack.length) return;
    grid.load(JSON.parse(historyStack.pop()));
    setTimeout(resizeGrid, 50);
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
    }
});

function loadDefault() {
    grid.removeAll();

    defaultLayout.forEach(w => {
        grid.addWidget({
            ...w,
            content: `<div class="grid-stack-item-content">${w.content}</div>`
        });
    });

    setTimeout(resizeGrid, 50);
}

loadDefault();

//  RESIZE 
function resizeGrid() {
    const container = document.querySelector('.grid-stack');
    let maxRow = 0;

    grid.engine.nodes.forEach(n => {
        maxRow = Math.max(maxRow, n.y + n.h);
    });

    grid.cellHeight(container.clientHeight / maxRow);
}

window.addEventListener('load', () => setTimeout(resizeGrid, 100));
window.addEventListener('resize', () => setTimeout(resizeGrid, 100));

//  ADD 
function addWidget() {
    saveState();

    grid.addWidget({
        w: 3,
        h: 1,
        content: `<div class="grid-stack-item-content">New</div>`
    });

    setTimeout(resizeGrid, 50);
}

//  SAVE / LOAD 
function saveLayout() {
    localStorage.setItem("layout", JSON.stringify(grid.save()));
}

function loadLayout() {
    const layout = JSON.parse(localStorage.getItem("layout"));
    if (layout) {
        grid.load(layout);
        setTimeout(resizeGrid, 50);
    }
}

function resetLayout() {
    localStorage.removeItem("layout");
    loadDefault();
}

//  SELECTION 
let selectedItems = [];

document.addEventListener('click', function (e) {
    const item = e.target.closest('.grid-stack-item');
    if (!item) return;

    const index = selectedItems.indexOf(item);

    if (index > -1) {
        item.classList.remove('selected');
        selectedItems.splice(index, 1);
    } else {
        if (selectedItems.length < 2) {
            item.classList.add('selected');
            selectedItems.push(item);
        }
    }

    document.getElementById('swapBtn').disabled = selectedItems.length !== 2;
});

//  SWAP (TRUE REPLACE) 
function confirmSwap() {
    if (selectedItems.length !== 2) return;

    if (confirm("Swap selected grids?")) {
        swapItems(selectedItems[0], selectedItems[1]);

        selectedItems.forEach(el => el.classList.remove('selected'));
        selectedItems = [];
        document.getElementById('swapBtn').disabled = true;
    }
}

function swapItems(el1, el2) {
    if (!el1 || !el2) return;

    saveState();

    const n1 = el1.gridstackNode;
    const n2 = el2.gridstackNode;

    // store values
    const pos1 = { x: n1.x, y: n1.y, w: n1.w, h: n1.h };
    const pos2 = { x: n2.x, y: n2.y, w: n2.w, h: n2.h };

    // 🔒 freeze layout
    grid.batchUpdate();

    // step 1: move first out temporarily (IMPORTANT)
    grid.move(el1, pos1.x, pos1.y + 100); // move out of grid

    // step 2: move second into first position
    grid.move(el2, pos1.x, pos1.y);
    grid.resize(el2, pos1.w, pos1.h);

    // step 3: move first into second position
    grid.move(el1, pos2.x, pos2.y);
    grid.resize(el1, pos2.w, pos2.h);

    // 🔓 apply changes
    grid.commit();
}
//  DELETE 
function deleteSelected() {
    if (selectedItems.length === 1) {
        saveState();

        grid.removeWidget(selectedItems[0]);
        selectedItems = [];
    } else {
        alert("Select one item to delete");
    }
}

//  AUTO SAVE ON DRAG 
grid.on('change', () => {
    saveState();
});