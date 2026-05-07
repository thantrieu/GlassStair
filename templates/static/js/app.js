let currentDeleteElement = null;
let zoomLevel = 1;

function zoomIn() {
    zoomLevel = Math.min(zoomLevel * 1.2, 5);
    draw();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel / 1.2, 0.2);
    draw();
}

function addHole() {
    const container = document.getElementById("holes-container");
    const count = container.children.length + 1;

    const div = document.createElement("div");
    div.className = "flex gap-2 items-center";

    div.innerHTML = `
        <input type="number" name="holes[]"
               class="flex-1 p-3 border rounded-lg"
               placeholder="Khoảng cách ${count}">

        <button type="button" onclick="openConfirm(this)"
                class="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" 
                 class="w-5 h-5"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4h6v3"/>
            </svg>
        </button>
    `;

    container.appendChild(div);
}

function openConfirm(button) {
    currentDeleteElement = button;
    document.getElementById("confirm-modal").classList.remove("hidden");
    document.getElementById("confirm-modal").classList.add("flex");
}

function closeModal() {
    document.getElementById("confirm-modal").classList.add("hidden");
    document.getElementById("confirm-modal").classList.remove("flex");
    currentDeleteElement = null;
}

function confirmRemove() {
    const container = document.getElementById("holes-container");

    if (container.children.length === 1) {
        closeModal();
        return;
    }

    if (currentDeleteElement) {
        currentDeleteElement.parentElement.remove();
    }

    updatePlaceholders();
    closeModal();
}

function updatePlaceholders() {
    const container = document.getElementById("holes-container");
    const inputs = container.querySelectorAll("input");

    inputs.forEach((input, index) => {
        input.placeholder = `Khoảng cách ${index + 1}`;
    });
}

function create(tag, attrs, text) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (let k in attrs) el.setAttribute(k, attrs[k]);
    if (text) el.textContent = text;
    return el;
}

// ===== ARROW DEF =====
function createDefs(svg) {
    const defs = create("defs");
    defs.innerHTML = `
        <marker id="arrow-out" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <path d="M10,0 L0,5 L10,10 Z" fill="black"/>
        </marker>
    `;
    svg.appendChild(defs);
}

// ===== DIMENSION =====
function drawDimension(svg, x1, y1, x2, y2, text) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    svg.appendChild(create("line", {
        x1, y1, x2, y2,
        stroke: "black",
        "marker-start": "url(#arrow-out)",
        "marker-end": "url(#arrow-out)"
    }));

    svg.appendChild(create("text", {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        "font-size": "12",
        transform: `rotate(${angle}, ${(x1 + x2) / 2}, ${(y1 + y2) / 2})`
    }, text + " mm"));
}

function create(tag, attrs, text) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (let k in attrs) el.setAttribute(k, attrs[k]);
    if (text) el.textContent = text;
    return el;
}

// ===== ARROW DEFINITIONS =====
function createDefs(svg) {
    const defs = create("defs");

    defs.innerHTML = `
        <marker id="arrow-start" markerWidth="10" markerHeight="10" refX="2" refY="5" orient="auto">
            <path d="M10,0 L0,5 L10,10" fill="black"/>
        </marker>
        <marker id="arrow-end" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10" fill="black"/>
        </marker>
    `;

    svg.appendChild(defs);
}

// ===== DIMENSION =====
function drawDimension(svg, x1, y1, x2, y2, text) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // line mảnh
    svg.appendChild(create("line", {
        x1, y1, x2, y2,
        stroke: "black",
        "stroke-width": 1,
        "marker-start": "url(#arrow-start)",
        "marker-end": "url(#arrow-end)"
    }));

    // offset text tránh đè line
    const offset = 12;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;

    svg.appendChild(create("text", {
        x: (x1 + x2) / 2 + nx * offset,
        y: (y1 + y2) / 2 + ny * offset,
        "text-anchor": "middle",
        "font-size": "12",
        transform: `rotate(${angle}, ${(x1 + x2) / 2}, ${(y1 + y2) / 2})`
    }, text + " mm"));
}

// ===== MAIN =====
function draw() {
    const total_length = +document.querySelector('[name="total_length"]').value || 0;
    const upper_height = +document.querySelector('[name="upper_height"]').value || 0;
    const lower_height = +document.querySelector('[name="lower_height"]').value || 0;
    const concrete = +document.querySelector('[name="concrete_thickness"]').value || 0;
    const step = +document.querySelector('[name="step_height"]').value || 0;

    if (!total_length || !lower_height) return;

    const svg = document.getElementById("drawing");
    svg.innerHTML = "";
    createDefs(svg);

    const padding = 120;

    // AUTO SCALE
    const maxSize = 600;
    const baseScale = Math.min(
        maxSize / total_length,
        maxSize / lower_height
    );

    const scale = baseScale * zoomLevel;

    const width = total_length * scale;
    const height = lower_height * scale;

    svg.setAttribute("height", height + padding * 2);

    const ox = padding;
    const oy = padding;

    // RECT
    svg.appendChild(create("rect", {
        x: ox, y: oy,
        width, height,
        fill: "none",
        stroke: "black"
    }));

    // ===== D1 =====
    const x1 = ox;
    const y1 = oy + height;

    const x2 = ox + width;
    const y2 = oy + upper_height * scale;

    svg.appendChild(create("line", {
        x1, y1, x2, y2,
        stroke: "blue",
        "stroke-width": 2
    }));

    const dx = x2 - x1;
    const dy = y2 - y1;

    // ===== M =====
    const mx = x1;
    const my = y1 - concrete * scale;

    // ===== D2 =====
    const rightX = ox + width;
    const tR2 = (rightX - mx) / dx;
    const yR2 = my + dy * tR2;

    svg.appendChild(create("line", {
        x1: mx,
        y1: my,
        x2: rightX,
        y2: yR2,
        stroke: "blue",
        "stroke-dasharray": "6"
    }));

    // ===== L (giao trái) =====
    const tL2 = (ox - mx) / dx;
    const Ly = my + dy * tL2;

    // ===== D3 =====
    const sx3 = ox;
    const sy3 = Ly - step * scale;

    const tR3 = (rightX - sx3) / dx;
    const yR3 = sy3 + dy * tR3;

    svg.appendChild(create("line", {
        x1: sx3,
        y1: sy3,
        x2: rightX,
        y2: yR3,
        stroke: "blue",
        "stroke-width": 2
    }));

    // ===== NỐI D1 - D3 (TRÁI) =====
    svg.appendChild(create("line", {
        x1: ox,
        y1: y1,
        x2: ox,
        y2: sy3,
        stroke: "blue"
    }));

    // ===== NỐI D1 - D3 (PHẢI) =====
    svg.appendChild(create("line", {
        x1: rightX,
        y1: y2,
        x2: rightX,
        y2: yR3,
        stroke: "blue"
    }));

    // ===== DIMENSIONS =====

    // chiều dài
    drawDimension(svg,
        ox, oy - 40,
        ox + width, oy - 40,
        total_length
    );

    // chiều cao trái
    drawDimension(svg,
        ox - 40, oy,
        ox - 40, oy + height,
        lower_height
    );

    // chiều cao phải
    drawDimension(svg,
        ox + width + 40, oy,
        ox + width + 40, oy + upper_height * scale,
        upper_height
    );

    // ===== DISTANCE D1 → D3 (TRÁI) =====
    const distLeft = Math.abs(y1 - sy3) / scale;

    drawDimension(svg,
        ox - 80, y1,
        ox - 80, sy3,
        distLeft.toFixed(0)
    );

    // ===== DISTANCE D1 → D3 (PHẢI) =====
    const distRight = Math.abs(y2 - yR3) / scale;

    drawDimension(svg,
        ox + width + 80, y2,
        ox + width + 80, yR3,
        distRight.toFixed(0)
    );

    // ===== HOLE DISTANCES (UPDATED UI) =====
    const holeInputs = document.querySelectorAll('[name="holes[]"]');

    let holes = [];
    holeInputs.forEach(i => {
        const v = parseFloat(i.value);
        if (!isNaN(v) && v > 0) holes.push(v);
    });

    let acc = 0;

    holes.forEach((h, index) => {

        acc += h;
        const x = ox + acc * scale;

        if (x > ox + width) return;

        // ===== đường gióng =====
        svg.appendChild(create("line", {
            x1: x,
            y1: oy,
            x2: x,
            y2: oy + height,
            stroke: "black",
            "stroke-width": 1,
            "stroke-dasharray": "2"
        }));

        // ===== giao điểm với D1 =====
        const t = (x - x1) / dx;
        const yIntersect = y1 + dy * t;

        // ===== CONFIG =====
        const r = 6;                 // x2 bán kính
        const offset = 30;           // x2 khoảng cách
        const lift = 15;             // dịch lên thêm

        const baseY = yIntersect - lift;

        // ===== circle dưới =====
        svg.appendChild(create("circle", {
            cx: x,
            cy: baseY,
            r: r,
            stroke: "red",
            fill: "none",
            "stroke-width": 1
        }));

        // ===== circle trên =====
        const cy2 = baseY - offset;

        svg.appendChild(create("circle", {
            cx: x,
            cy: cy2,
            r: r,
            stroke: "red",
            fill: "none",
            "stroke-width": 1
        }));

        // ===== line nối =====
        svg.appendChild(create("line", {
            x1: x,
            y1: baseY,
            x2: x,
            y2: cy2,
            stroke: "red",
            "stroke-width": 1
        }));

        // ===== TEXT 50 / 100 =====
        // ===== VECTOR D1 =====
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;

        // pháp tuyến (hướng ra ngoài bên trái)
        const nx = -uy;
        const ny = ux;

        // khoảng cách tránh đè lên circle
        const gap = 6;
        const textOffset = r + gap;

        // góc xoay theo D1
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        // ===== TEXT 100 (circle trên) =====
        svg.appendChild(create("text", {
            x: x + nx * textOffset,
            y: cy2 + ny * textOffset,
            "text-anchor": "end",
            "font-size": "10",
            fill: "red",
            transform: `rotate(${angle}, ${x}, ${cy2})`
        }, "100"));

        // ===== TEXT 50 (circle dưới) =====
        svg.appendChild(create("text", {
            x: x + nx * textOffset,
            y: baseY + ny * textOffset,
            "text-anchor": "end",
            "font-size": "10",
            fill: "red",
            transform: `rotate(${angle}, ${x}, ${baseY})`
        }, "50"));

        // ===== HELPER: intersection 2 line =====
        function intersect(p1, p2, p3, p4) {
            const A1 = p2.y - p1.y;
            const B1 = p1.x - p2.x;
            const C1 = A1 * p1.x + B1 * p1.y;

            const A2 = p4.y - p3.y;
            const B2 = p3.x - p4.x;
            const C2 = A2 * p3.x + B2 * p3.y;

            const det = A1 * B2 - A2 * B1;
            if (det === 0) return null;

            return {
                x: (B2 * C1 - B1 * C2) / det,
                y: (A1 * C2 - A2 * C1) / det
            };
        }

        const lenD1 = Math.sqrt(dx * dx + dy * dy);
        const ux1 = dx / lenD1;
        const uy1 = dy / lenD1;

        // vuông góc D1
        const nx1 = -uy1;
        const ny1 = ux1;

        // vector D3 (song song D1)
        const ux3 = ux1;
        const uy3 = uy1;

        // vuông góc D3
        const nx3 = -uy3;
        const ny3 = ux3;

        // A = góc trái dưới
        const A = { x: x1, y: y1 };

        // line vuông góc D1 tại A
        const lineA_end = {
            x: A.x + nx1 * 1000,
            y: A.y + ny1 * 1000
        };

        // D3 (kéo dài 2 phía)
        const D3_p1 = { x: sx3 - dx * 2, y: sy3 - dy * 2 };
        const D3_p2 = { x: sx3 + dx * 2, y: sy3 + dy * 2 };

        // giao điểm P1
        const P1 = intersect(A, lineA_end, D3_p1, D3_p2);

        // vẽ cạnh trái (đen mảnh)
        svg.appendChild(create("line", {
            x1: A.x,
            y1: A.y,
            x2: P1.x,
            y2: P1.y,
            stroke: "black",
            "stroke-width": 1
        }));

        // P2 = giao D3 với vertical extension
        const P2 = {
            x: rightX,
            y: yR3
        };

        // đường vuông góc D3 tại P2
        const perp_end = {
            x: P2.x + nx3 * 1000,
            y: P2.y + ny3 * 1000
        };

        // D1 kéo dài
        const D1_p1 = { x: x1 - dx * 2, y: y1 - dy * 2 };
        const D1_p2 = { x: x2 + dx * 2, y: y2 + dy * 2 };

        // giao điểm P3
        const P3 = intersect(P2, perp_end, D1_p1, D1_p2);

        // vẽ cạnh phải
        svg.appendChild(create("line", {
            x1: P2.x,
            y1: P2.y,
            x2: P3.x,
            y2: P3.y,
            stroke: "black",
            "stroke-width": 1
        }));

        // ===== KÉO DÀI D1 LÊN ĐẾN P3 (PHẦN BẠN THIẾU) =====
        svg.appendChild(create("line", {
            x1: x2,      // đầu mút hiện tại của D1 (góc phải trên của hình gốc)
            y1: y2,
            x2: P3.x,    // điểm giao với đường vuông góc của D3
            y2: P3.y,
            stroke: "blue",
            "stroke-width": 2
        }));

        // ===== 1. cạnh dưới (song song D1) =====
        const bottomEnd = {
            x: A.x + dx * 2,
            y: A.y + dy * 2
        };

        // tìm giao với cạnh phải (x = rightX)
        const tBottom = (rightX - A.x) / dx;
        const B = {
            x: rightX,
            y: A.y + dy * tBottom
        };

        // vẽ cạnh dưới
        svg.appendChild(create("line", {
            x1: A.x,
            y1: A.y,
            x2: B.x,
            y2: B.y,
            stroke: "black",
            "stroke-width": 1
        }));

        // ===== 2. cạnh trên (song song D1) =====
        const tTop = (rightX - P1.x) / dx;
        const C = {
            x: rightX,
            y: P1.y + dy * tTop
        };

        // vẽ cạnh trên
        svg.appendChild(create("line", {
            x1: P1.x,
            y1: P1.y,
            x2: C.x,
            y2: C.y,
            stroke: "black",
            "stroke-width": 1
        }));

        // ===== 3. cạnh phải (vuông góc D1) =====
        // từ C xuống B
        svg.appendChild(create("line", {
            x1: C.x,
            y1: C.y,
            x2: B.x,
            y2: B.y,
            stroke: "black",
            "stroke-width": 1
        }));
    });
}

// bind
document.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    draw();
});

document.getElementById("btn-add-hole")
    .addEventListener("click", addHole);